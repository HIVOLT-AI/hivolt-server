import {
  ChainAddress,
  ChainContext,
  Network,
  Signer,
  Wormhole,
  Chain,
  TokenId,
  isTokenId,
  TokenAddress,
  UniversalAddress,
  wormhole,
  signSendWait,
} from '@wormhole-foundation/sdk';
import evm from '@wormhole-foundation/sdk/evm';
import solana from '@wormhole-foundation/sdk/solana';
import { Agent } from 'src/agent';
import { ENV } from 'src/config/env.config';
import { NetworkType } from 'src/shared/types/chain';
import { CreateWrappedTokenResponse } from 'src/shared/types/wormhole';

export async function getSigner<N extends Network, C extends Chain>(
  chain: ChainContext<N, C>,
  gasLimit?: bigint,
): Promise<{
  chain: ChainContext<N, C>;
  signer: Signer<N, C>;
  address: ChainAddress<C>;
}> {
  let signer: Signer;
  const platform = chain.platform.utils()._platform;

  switch (platform) {
    case 'Solana':
      signer = await (
        await solana()
      ).getSigner(await chain.getRpc(), ENV.SOLANA_ACCOUNT_PRIVATE_KEY);
      break;
    case 'Evm': {
      const evmSignerOptions = gasLimit ? { gasLimit } : {};
      signer = await (
        await evm()
      ).getSigner(
        await chain.getRpc(),
        ENV.EVM_ACCOUNT_PRIVATE_KEY,
        evmSignerOptions,
      );
      break;
    }
    default:
      throw new Error('Unsupported platform: ' + platform);
  }

  return {
    chain,
    signer: signer as Signer<N, C>,
    address: Wormhole.chainAddress(chain.chain, signer.address()),
  };
}

export async function getTokenDecimals<
  N extends 'Mainnet' | 'Testnet' | 'Devnet',
>(
  wh: Wormhole<N>,
  token: TokenId,
  sendChain: ChainContext<N, any>,
): Promise<number> {
  return isTokenId(token)
    ? Number(await wh.getDecimals(token.chain, token.address))
    : sendChain.config.nativeTokenDecimals;
}

export const isTokenWrapped = async (
  wh: Wormhole<Network>,
  srcChain: Chain,
  destChain: Chain,
  tokenAddress: string,
): Promise<TokenAddress<Chain> | UniversalAddress | null> => {
  try {
    const tokenId = Wormhole.tokenId(srcChain, tokenAddress);
    const destChainContext = wh.getChain(destChain);
    const tbDest = await destChainContext.getTokenBridge();

    const wrapped = await tbDest.getWrappedAsset(tokenId);
    return wrapped;
  } catch (_) {
    return null;
  }
};

export const createWrappedToken = async (
  agent: Agent,
  destinationChain: Chain,
  tokenAddress: string,
  network: NetworkType,
): Promise<CreateWrappedTokenResponse> => {
  try {
    const gasLimit = BigInt(2_500_000);

    const wh = await wormhole(network || 'Mainnet', [evm, solana]);

    // Get chain contexts
    const srcChain = wh.getChain('Solana');
    const destChain = wh.getChain(destinationChain);

    // Check if token is already wrapped
    const wrapped = await isTokenWrapped(
      wh,
      'Solana',
      destinationChain,
      tokenAddress,
    );
    if (wrapped) {
      return {
        success: true,
        wrappedToken: {
          chain: destinationChain,
          address: wrapped,
        },
      };
    }

    // Destination chain signer setup
    const { signer: destSigner } = await getSigner(destChain, gasLimit);
    const tbDest = await destChain.getTokenBridge();

    // Source chain signer setup
    const { signer: origSigner } = await getSigner(srcChain);

    // Create an attestation transaction on the source chain
    const tbOrig = await srcChain.getTokenBridge();

    // Parse the address properly for the source chain
    const parsedTokenAddress = Wormhole.parseAddress(
      srcChain.chain,
      tokenAddress,
    );
    const signerAddress = Wormhole.parseAddress(
      origSigner.chain(),
      origSigner.address(),
    );

    // Create the attestation transaction
    const attestTxns = tbOrig.createAttestation(
      parsedTokenAddress,
      signerAddress,
    );

    // Sign and send the attestation transaction
    const txids = await signSendWait(srcChain, attestTxns, origSigner);
    const txid = txids[0]!.txid;

    // Retrieve the Wormhole message ID from the attestation transaction
    const msgs = await srcChain.parseTransaction(txid);

    if (!msgs || msgs.length === 0) {
      throw new Error('No messages found in the transaction');
    }

    // Wait for the VAA to be available
    const timeout = 25 * 60 * 1000;
    const vaa = await wh.getVaa(msgs[0]!, 'TokenBridge:AttestMeta', timeout);
    if (!vaa) {
      throw new Error(
        'VAA not found after retries exhausted. Try extending the timeout.',
      );
    }

    // Submit the attestation on the destination chain
    const subAttestation = tbDest.submitAttestation(
      vaa,
      Wormhole.parseAddress(destSigner.chain(), destSigner.address()),
    );

    signSendWait(destChain, subAttestation, destSigner);

    let wrappedAsset: TokenAddress<Chain> | null = null;
    let attempts = 0;
    const maxAttempts = 10;

    while (!wrappedAsset && attempts < maxAttempts) {
      try {
        const tokenId = Wormhole.tokenId(srcChain.chain, tokenAddress);
        wrappedAsset = await tbDest.getWrappedAsset(tokenId);
      } catch (_) {
        attempts++;
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    if (!wrappedAsset) {
      throw new Error('Failed to get wrapped asset after multiple attempts');
    }

    return {
      success: true,
      wrappedToken: {
        chain: destinationChain,
        address: wrappedAsset,
      },
      attestationTxid: txid,
    };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
};
