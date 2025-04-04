import { Percentage } from '@orca-so/common-sdk';
import { Wallet } from '@coral-xyz/anchor';
import {
  buildWhirlpoolClient,
  increaseLiquidityQuoteByInputToken,
  NO_TOKEN_EXTENSION_CONTEXT,
  ORCA_WHIRLPOOL_PROGRAM_ID,
  PriceMath,
  TokenExtensionContextForPool,
  WhirlpoolContext,
} from '@orca-so/whirlpools-sdk';
import {
  Keypair,
  PublicKey,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import { Decimal } from 'decimal.js';
import { Agent } from 'src/agent';
import { TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { Action } from 'src/shared/types/actions';
import { z } from 'zod';
import { Tool } from 'langchain/tools';

export const OrcaOpenSingleSidePositionAction: Action = {
  name: 'ORCA_OPEN_SINGLESIDE_POSITION',
  similes: [
    'open orca singleside position',
    'open orca single side position',
    'orca singleside position',
    'orca single side position',
    'create orca single side position',
    'initiate orca single side position',
    'start orca single side position',
  ],
  description: 'Open a single-sided liquidity position in an Orca Whirlpool',
  examples: [
    [
      {
        input: {
          whirlpoolAddress: 'Whirlpool address',
          distanceFromCurrentPriceBps: 250,
          widthBps: 500,
          mint: '7Uuzh9JwqF8z3u6MWpQuQJbpD1u46xPDY6PGjwfwTh4o',
          amount: '1000000000',
        },
        output: {
          status: 'success',
          message: 'Single-sided position opened successfully',
          txId: '2jg87stmvPygRXJrqfpydZQSzGJK9rKvawekzy5mzuEmSjRf8bCmiGpFH8iLa2YrQxtreWcK99319DVTpCJHYZfx',
          positionMint: 'positionMintAddress',
        },
        explanation:
          'Open a single-sided liquidity position in an Orca Whirlpool',
      },
    ],
  ],
  schema: z.object({
    whirlpoolAddress: z.string(),
    distanceFromCurrentPriceBps: z.number(),
    widthBps: z.number(),
    mint: z.string(),
    amount: z.string(),
  }),
  handler: async (agent: Agent, input: Record<string, any>) => {
    try {
      const result = await orca_open_singleside_position(
        agent,
        input.whirlpoolAddress,
        input.distanceFromCurrentPriceBps,
        input.widthBps,
        input.mint,
        new Decimal(input.amount),
      );

      return {
        status: 'success',
        message: 'Single-sided position opened successfully',
        txId: result.txId,
        positionMint: result.positionMint,
      };
    } catch (error: any) {
      return {
        status: 'error',
        message: `Failed to open single-sided position: ${error.message}`,
      };
    }
  },
};

export class OrcaOpenSingleSidePositionTool extends Tool {
  name = 'ORCA_OPEN_SINGLESIDE_POSITION';
  description = `Open a single-sided liquidity position in an Orca Whirlpool.

  Inputs (input is a JSON string):
  whirlpoolAddress: string, eg "Whirlpool address" (required)
  distanceFromCurrentPriceBps: number, eg 250 (required)
  widthBps: number, eg 500 (required)
  inputTokenMint: string, eg "7Uuzh9JwqF8z3u6MWpQuQJbpD1u46xPDY6PGjwfwTh4o" (required)
  inputAmount: string, eg "1000000000" (required)
  `;

  constructor(private agent: Agent) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      const result = await this.agent.orcaOpenSingleSidePosition(
        parsedInput.whirlpoolAddress,
        parsedInput.distanceFromCurrentPriceBps,
        parsedInput.widthBps,
        parsedInput.inputTokenMint,
        new Decimal(parsedInput.inputAmount),
      );

      return JSON.stringify({
        status: 'success',
        message: 'Single-sided position opened successfully',
        txId: result.txId,
        positionMint: result.positionMint,
      });
    } catch (error: any) {
      return JSON.stringify({
        status: 'error',
        message: `Failed to open single-sided position: ${error.message}`,
        code: error.code || 'UNKNOWN_ERROR',
      });
    }
  }
}

export async function orca_open_singleside_position(
  agent: Agent,
  whirlpoolAddress: string,
  distanceFromCurrentPriceBps: number,
  widthBps: number,
  inputTokenMint: string,
  inputAmount: Decimal,
): Promise<{ txId: string; positionMint: string }> {
  try {
    const wallet = new Wallet(agent.account);
    const ctx = WhirlpoolContext.from(
      agent.connection,
      wallet,
      ORCA_WHIRLPOOL_PROGRAM_ID,
    );
    const client = buildWhirlpoolClient(ctx);

    const whirlpool = await client.getPool(whirlpoolAddress);
    const whirlpoolData = whirlpool.getData();
    const mintInfoA = whirlpool.getTokenAInfo();
    const mintInfoB = whirlpool.getTokenBInfo();
    const price = PriceMath.sqrtPriceX64ToPrice(
      whirlpoolData.sqrtPrice,
      mintInfoA.decimals,
      mintInfoB.decimals,
    );

    const isTokenA = new PublicKey(inputTokenMint).equals(mintInfoA.mint);
    let lowerBoundPrice;
    let upperBoundPrice;
    let lowerTick;
    let upperTick;
    if (isTokenA) {
      lowerBoundPrice = price.mul(1 + distanceFromCurrentPriceBps / 10000);
      upperBoundPrice = lowerBoundPrice.mul(1 + widthBps / 10000);
      upperTick = PriceMath.priceToInitializableTickIndex(
        upperBoundPrice,
        mintInfoA.decimals,
        mintInfoB.decimals,
        whirlpoolData.tickSpacing,
      );
      lowerTick = PriceMath.priceToInitializableTickIndex(
        lowerBoundPrice,
        mintInfoA.decimals,
        mintInfoB.decimals,
        whirlpoolData.tickSpacing,
      );
    } else {
      lowerBoundPrice = price.mul(1 - distanceFromCurrentPriceBps / 10000);
      upperBoundPrice = lowerBoundPrice.mul(1 - widthBps / 10000);
      lowerTick = PriceMath.priceToInitializableTickIndex(
        upperBoundPrice,
        mintInfoA.decimals,
        mintInfoB.decimals,
        whirlpoolData.tickSpacing,
      );
      upperTick = PriceMath.priceToInitializableTickIndex(
        lowerBoundPrice,
        mintInfoA.decimals,
        mintInfoB.decimals,
        whirlpoolData.tickSpacing,
      );
    }

    const txBuilderTickArrays = await whirlpool.initTickArrayForTicks([
      lowerTick,
      upperTick,
    ]);
    let instructions: TransactionInstruction[] = [];
    let signers: Keypair[] = [];
    if (txBuilderTickArrays !== null) {
      const txPayloadTickArrays = await txBuilderTickArrays.build();
      const txPayloadTickArraysDecompiled = TransactionMessage.decompile(
        (txPayloadTickArrays.transaction as VersionedTransaction).message,
      );
      instructions = instructions.concat(
        txPayloadTickArraysDecompiled.instructions,
      );
      signers = signers.concat(txPayloadTickArrays.signers as Keypair[]);
    }

    const tokenExtensionCtx: TokenExtensionContextForPool = {
      ...NO_TOKEN_EXTENSION_CONTEXT,
      tokenMintWithProgramA: mintInfoA,
      tokenMintWithProgramB: mintInfoB,
    };
    const increaseLiquiditQuote = increaseLiquidityQuoteByInputToken(
      new PublicKey(inputTokenMint),
      inputAmount,
      lowerTick,
      upperTick,
      Percentage.fromFraction(1, 100),
      whirlpool,
      tokenExtensionCtx,
    );
    const { positionMint, tx: txBuilder } =
      await whirlpool.openPositionWithMetadata(
        lowerTick,
        upperTick,
        increaseLiquiditQuote,
        undefined,
        undefined,
        undefined,
        TOKEN_2022_PROGRAM_ID,
      );

    const txPayload = await txBuilder.build();
    const txPayloadDecompiled = TransactionMessage.decompile(
      (txPayload.transaction as VersionedTransaction).message,
    );
    instructions = instructions.concat(txPayloadDecompiled.instructions);
    signers = signers.concat(txPayload.signers as Keypair[]);

    const { blockhash } = await agent.connection.getLatestBlockhash();

    const newMessage = new TransactionMessage({
      payerKey: agent.account.publicKey,
      recentBlockhash: blockhash,
      instructions,
    }).compileToV0Message();

    const newTx = new VersionedTransaction(newMessage);

    newTx.sign(signers);

    const txId = await agent.connection.sendTransaction(newTx, {
      maxRetries: 3,
    });

    return {
      txId,
      positionMint: positionMint.toBase58(),
    };
  } catch (error: any) {
    throw new Error(`Failed to open single side position: ${error.message}`);
  }
}
