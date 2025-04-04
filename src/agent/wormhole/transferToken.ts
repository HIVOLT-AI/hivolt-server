import { Tool } from 'langchain/tools';
import { Action } from 'src/shared/types/actions';
import {
  wormhole,
  TokenId,
  Wormhole,
  amount,
  TokenTransfer,
  isTokenId,
  Chain,
  AttestationId,
} from '@wormhole-foundation/sdk';
import {
  createWrappedToken,
  getSigner,
  getTokenDecimals,
  isTokenWrapped,
} from 'src/shared/handler/wormhole';
import { NetworkType } from 'src/shared/types/chain';
import evm from '@wormhole-foundation/sdk/evm';
import solana from '@wormhole-foundation/sdk/solana';
import { TransferTokenResponse } from 'src/shared/types/wormhole';
import { z } from 'zod';
import { Agent } from 'src/agent';

export const WormholeTransferTokenAction: Action = {
  name: 'WORMHOLE_TRANSFER_TOKEN',
  description:
    'Transfer a token from Solana as source chain to another destination chain using Wormhole',

  similes: [
    'transfer token to other chain',
    'send token to other chain',
    'move token to other chain',
  ],
  examples: [
    [
      {
        input: {
          destinationChain: 'BaseSepolia',
          transferAmount: '0.1',
          network: 'Testnet',
          tokenAddress: '7Uuzh9JwqF8z3u6MWpQuQJbpD1u46xPDY6PGjwfwTh4o',
        },
        output: {
          status: 'success',
          message: 'Token transferred successfully',
        },
        explanation: 'Transfer 0.1 sol to BaseSepolia',
      },
    ],
  ],
  schema: z.object({
    destinationChain: z
      .string()
      .describe('The destination chain to transfer the token to'),
    network: z
      .string()
      .optional()
      .describe('The network to use for the transfer'),
    transferAmount: z.string().describe('The amount of tokens to transfer'),
    tokenAddress: z
      .string()
      .optional()
      .describe(
        'The address of the token to transfer, in case of solana, it is empty',
      ),
  }),
  handler: async (agent: Agent, input: Record<string, any>) => {
    try {
      const result = await wormhole_transfer_token(
        agent,
        input.destinationChain,
        input.network,
        input.transferAmount,
        input.tokenAddress,
      );

      return {
        status: 'success',
        message: 'Token transferred successfully',
        result,
      };
    } catch (error: any) {
      return {
        status: 'error',
        message: `Transfer token failed: ${error.message}`,
      };
    }
  },
};

export class WormholeTransferTokenTool extends Tool {
  name = 'WORMHOLE_TRANSFER_TOKEN';
  description = `Transfer a token from Solana as source chain to another destination chain using Wormhole.

  Inputs (input is a JSON string):
  destinationChain: string, eg "BaseSepolia" (required)
  network: string, eg "Devnet" (optional)
  transferAmount: string, eg "0.1" (required)
  tokenAddress: string, eg "7Uuzh9JwqF8z3u6MWpQuQJbpD1u46xPDY6PGjwfwTh4o" (optional)
  `;

  constructor(private agent: Agent) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      const result = await this.agent.wormholeTransferToken(
        parsedInput.destinationChain,
        parsedInput.network,
        parsedInput.transferAmount,
        parsedInput.tokenAddress,
      );

      return JSON.stringify({
        status: 'success',
        message: 'Token transferred successfully',
        result: result,
      });
    } catch (error: any) {
      return JSON.stringify({
        status: 'error',
        message: `Transfer token failed: ${error.message}`,
        code: error.code || 'UNKNOWN_ERROR',
      });
    }
  }
}

export const wormhole_transfer_token = async (
  agent: Agent,
  destinationChain: Chain,
  network: NetworkType,
  transferAmount: string,
  tokenAddress?: TokenId,
): Promise<TransferTokenResponse> => {
  try {
    const wh = await wormhole(network || 'Mainnet', [evm, solana]);
    const sourceChainName = 'Solana';
    const destinationChainName = destinationChain;

    const sendChain = wh.getChain(sourceChainName);
    const source = await getSigner(sendChain);

    const rcvChain = wh.getChain(destinationChainName);
    const destination = await getSigner(rcvChain);

    let token: TokenId;

    if (!tokenAddress) {
      token = Wormhole.tokenId(sendChain.chain, 'native');
    } else if (typeof tokenAddress === 'string') {
      token = Wormhole.tokenId(sendChain.chain, tokenAddress);
    } else if (isTokenId(tokenAddress)) {
      token = tokenAddress;
    } else {
      token = Wormhole.tokenId(sendChain.chain, 'native');
    }

    if (token.address !== 'native') {
      const tokenAddressStr = token.address.toString();

      const isWrapped = await isTokenWrapped(
        wh,
        sourceChainName,
        destinationChainName,
        tokenAddressStr,
      );

      if (!isWrapped) {
        const wrappedTokenResult = await createWrappedToken(
          agent,
          destinationChainName,
          tokenAddressStr,
          network || 'Testnet',
        );

        if (!wrappedTokenResult.success) {
          throw new Error(
            `Failed to create wrapped token: ${wrappedTokenResult.error}`,
          );
        }
      }
    }

    const amt = transferAmount ?? '0.01';
    const automatic = false;

    const decimals = await getTokenDecimals(wh, token, sendChain);

    // Create a TokenTransfer object to track the state of the transfer
    const xfer = await wh.tokenTransfer(
      token,
      amount.units(amount.parse(amt, decimals)),
      source.address,
      destination.address,
      automatic,
    );

    const quote = await TokenTransfer.quoteTransfer(
      wh,
      source.chain,
      destination.chain,
      xfer.transfer,
    );

    if (xfer.transfer.automatic && quote.destinationToken.amount < 0) {
      throw 'The amount requested is too low to cover the fee and any native gas requested.';
    }

    const srcTxids = await xfer.initiateTransfer(source.signer);

    if (automatic) {
      return {
        success: true,
        srcTxIds: srcTxids,
        dstTxIds: [],
        transferId: xfer.txids[0],
      };
    }

    let attestation: AttestationId[] | null = null;
    let attempts = 0;
    const maxAttempts = 10;

    while (!attestation && attempts < maxAttempts) {
      try {
        attestation = await xfer.fetchAttestation(60_000);
      } catch (_) {
        attempts++;
        await new Promise((resolve) => setTimeout(resolve, 30000));
      }
    }

    if (!attestation) {
      throw new Error('Failed to get attestation after multiple attempts');
    }

    const destTxids = await xfer.completeTransfer(destination.signer);

    return {
      success: true,
      srcTxIds: srcTxids,
      dstTxIds: destTxids,
      transferId: xfer.txids[0],
    };
  } catch (error: any) {
    throw new Error(`Creating wrapped token failed: ${error.message}`);
  }
};
