import { Agent } from 'src/agent';
import { Decimal } from 'decimal.js';
import { ORCA_FEE_TIER } from 'src/shared/constants';
import { NetworkType } from 'src/shared/types/chain';
import {
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import { Wallet } from '@coral-xyz/anchor';
import {
  buildWhirlpoolClient,
  ORCA_WHIRLPOOL_PROGRAM_ID,
  PoolUtil,
  PriceMath,
  WhirlpoolContext,
} from '@orca-so/whirlpools-sdk';
import { Action } from 'src/shared/types/actions';
import { z } from 'zod';
import { Tool } from 'langchain/tools';

export const OrcaCreateClmmAction: Action = {
  name: 'ORCA_CREATE_CLMM',
  similes: [
    'create orca clmm',
    'create orca concentrated pool',
    'create orca clmm pool',
    'create orca concentrated liquidity',
  ],
  description: 'Create a new Orca CLMM liquidity pool on Solana with Orca',
  examples: [
    [
      {
        input: {
          mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
          pair: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          initialPrice: 1.1,
          feeTier: 1,
          network: 'Mainnet',
        },
        output: {
          status: 'success',
          message:
            'CLMM pool created successfully. Note: No liquidity was added.',
          txId: '2vNhfCobCY1D8Hpt1TVP7fJuKSBt5YDZkBVS8ZSmYrRg2Nyz6p5twJLDBEbi68H5J1oMYFP3ofV9aCocrnQPnjod',
          poolAddress: '3fDDwaH8tHfmLUKi5visWy4xQBhUNKYwwoVwz5uQGqAZ',
        },
        explanation: 'Create a new Orca CLMM pool with specified parameters',
      },
    ],
  ],
  schema: z.object({
    mint: z.string(),
    pair: z.string(),
    initialPrice: z.number().positive(),
    feeTier: z.number().positive(),
    network: z.string(),
  }),
  handler: async (agent: Agent, input: Record<string, any>) => {
    try {
      const result = await orca_create_clmm(
        agent,
        input.mint,
        input.pair,
        new Decimal(input.initialPrice),
        input.feeTier,
        input.network as NetworkType,
      );

      return {
        status: 'success',
        message:
          'CLMM pool created successfully. Note: No liquidity was added.',
        txId: result.txId,
        poolAddress: result.poolAddress,
      };
    } catch (error: any) {
      return {
        status: 'error',
        message: `Creating Orca CLMM failed: ${error.message}`,
      };
    }
  },
};

export class OrcaCreateClmmTool extends Tool {
  name = 'ORCA_CREATE_CLMM';
  description = `Create a Concentrated Liquidity Market Maker (CLMM) pool on Orca, 
  
  Inputs (JSON string):
  mint: string, the mint of the token you want to deploy (required).
  pair: string, The mint of the token you want to pair the deployed mint with (required).
  initialPrice: number, initial price of mintA in terms of mintB, e.g., 0.001 (required).
  feeTier: number, fee tier in bps. Options: 1, 2, 4, 5, 16, 30, 65, 100, 200 (required).
  network: string, network to deploy the CLMM on. Options: 'Mainnet', 'Testnet' (required).
  `;

  constructor(private agent: Agent) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      const result = await orca_create_clmm(
        this.agent,
        parsedInput.mint,
        parsedInput.pair,
        new Decimal(parsedInput.initialPrice),
        parsedInput.feeTier,
        parsedInput.network as NetworkType,
      );

      return JSON.stringify({
        status: 'success',
        message:
          'CLMM pool created successfully. Note: No liquidity was added.',
        txId: result.txId,
        poolAddress: result.poolAddress,
      });
    } catch (error: any) {
      return JSON.stringify({
        status: 'error',
        message: error.message,
        code: error.code || 'UNKNOWN_ERROR',
      });
    }
  }
}

export async function orca_create_clmm(
  agent: Agent,
  mint: string,
  pair: string,
  initialPrice: Decimal,
  feeTier: keyof typeof ORCA_FEE_TIER,
  network: NetworkType,
): Promise<{ txId: string; poolAddress: string }> {
  try {
    const configAddress =
      network === 'Mainnet'
        ? new PublicKey('2LecshUwdy9xi7meFgHtFJQNSKk4KdTrcpvaB56dP2NQ')
        : new PublicKey('FcrweFY1G9HJAHG5inkGB6pKg1HZ6x9UC2WioAfWrGkR');

    const wallet = new Wallet(agent.account);

    const ctx = WhirlpoolContext.from(
      agent.connection,
      wallet,
      ORCA_WHIRLPOOL_PROGRAM_ID,
    );

    const fetcher = ctx.fetcher;
    const client = buildWhirlpoolClient(ctx);

    const correctTokenOrder = PoolUtil.orderMints(
      new PublicKey(mint),
      new PublicKey(pair),
    ).map((addr) => addr.toString());
    const isCorrectMintOrder =
      correctTokenOrder[0] === new PublicKey(mint).toString();
    let mintA;
    let mintB;
    if (!isCorrectMintOrder) {
      [mintA, mintB] = [new PublicKey(pair), new PublicKey(mint)];
      initialPrice = new Decimal(1 / initialPrice.toNumber());
    } else {
      [mintA, mintB] = [new PublicKey(mint), new PublicKey(pair)];
    }
    const mintAAccount = await fetcher.getMintInfo(mintA);
    const mintBAccount = await fetcher.getMintInfo(mintB);
    if (mintAAccount === null || mintBAccount === null) {
      throw Error('Mint account not found');
    }

    const tickSpacing = ORCA_FEE_TIER[feeTier];
    const initialTick = PriceMath.priceToInitializableTickIndex(
      initialPrice,
      mintAAccount.decimals,
      mintBAccount.decimals,
      tickSpacing,
    );
    const { poolKey, tx: txBuilder } = await client.createPool(
      configAddress,
      mintA,
      mintB,
      tickSpacing,
      initialTick,
      wallet.publicKey,
    );

    const txPayload = await txBuilder.build();
    const txPayloadDecompiled = TransactionMessage.decompile(
      (txPayload.transaction as VersionedTransaction).message,
    );

    const instructions = txPayloadDecompiled.instructions;
    const { blockhash } = await agent.connection.getLatestBlockhash();

    const newMessage = new TransactionMessage({
      payerKey: agent.account.publicKey,
      recentBlockhash: blockhash,
      instructions,
    }).compileToV0Message();

    const newTx = new VersionedTransaction(newMessage);

    newTx.sign([agent.account]);

    const txId = await agent.connection.sendTransaction(newTx, {
      maxRetries: 3,
    });

    return {
      txId,
      poolAddress: poolKey.toBase58(),
    };
  } catch (error: any) {
    throw new Error(`Creating Orca CLMM failed: ${error.message}`);
  }
}
