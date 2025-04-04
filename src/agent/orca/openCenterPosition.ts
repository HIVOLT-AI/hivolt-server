import { Agent } from 'src/agent';
import { Decimal } from 'decimal.js';
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
import { Percentage } from '@orca-so/common-sdk';
import { TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { Action } from 'src/shared/types/actions';
import { z } from 'zod';
import { Tool } from 'langchain/tools';

export const OrcaOpenCenterPositionAction: Action = {
  name: 'ORCA_OPEN_CENTER_POSITION',
  description:
    'Open a center position in an Orca Whirlpool with specified parameters.',
  similes: [
    'open orca center position',
    'create orca center position',
    'initiate orca center position',
    'start orca center position',
  ],
  examples: [
    [
      {
        input: {
          whirlpoolAddress: 'EPjasdf...',
          priceOffsetBps: 500,
          inputTokenMint: 'EPjasdf...',
          inputAmount: 100.0,
        },
        output: {
          status: 'success',
          message: 'Center position opened successfully',
          txId: '2jg87stmvPygRXJrqfpydZQSzGJK9rKvawekzy5mzuEmSjRf8bCmiGpFH8iLa2YrQxtreWcK99319DVTpCJHYZfx',
          positionMint: 'EPjasdf...',
        },
        explanation: 'Open a center position in Orca Whirlpool',
      },
    ],
  ],
  schema: z.object({
    whirlpoolAddress: z.string(),
    priceOffsetBps: z.number(),
    inputTokenMint: z.string(),
    inputAmount: z.string(),
  }),
  handler: async (agent: Agent, input: Record<string, any>) => {
    try {
      const result = await orca_open_center_position(
        agent,
        input.whirlpoolAddress,
        input.priceOffsetBps,
        input.inputTokenMint,
        new Decimal(input.inputAmount),
      );
      return {
        status: 'success',
        message: 'Center position opened successfully',
        txId: result.txId,
        positionMint: result.positionMint,
      };
    } catch (error: any) {
      return {
        status: 'error',
        message: `Failed to open center position: ${error.message}`,
      };
    }
  },
};

export class OrcaOpenCenterPositionTool extends Tool {
  name = 'ORCA_OPEN_CENTER_POSITION';
  description = `Open a center position in an Orca Whirlpool with specified parameters.
    
  Inputs (input is a JSON string):
  whirlpoolAddress: string, eg "EPjasdf..." (required)
  priceOffsetBps: number, eg 500 (required)
  inputTokenMint: string, eg "EPjasdf..." (required)
  inputAmount: string, eg "100.0" (required)
  `;

  constructor(private agent: Agent) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      const result = await this.agent.orcaOpenCenterPosition(
        parsedInput.whirlpoolAddress,
        parsedInput.priceOffsetBps,
        parsedInput.inputTokenMint,
        new Decimal(parsedInput.inputAmount),
      );

      return JSON.stringify({
        status: 'success',
        message: 'Center position opened successfully',
        txId: result.txId,
        positionMint: result.positionMint,
      });
    } catch (error: any) {
      return JSON.stringify({
        status: 'error',
        message: `Failed to open center position: ${error.message}`,
        code: error.code || 'UNKNOWN_ERROR',
      });
    }
  }
}

export async function orca_open_center_position(
  agent: Agent,
  whirlpoolAddress: string,
  priceOffsetBps: number,
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

    const lowerPrice = price.mul(1 - priceOffsetBps / 10000);
    const upperPrice = price.mul(1 + priceOffsetBps / 10000);
    const lowerTick = PriceMath.priceToInitializableTickIndex(
      lowerPrice,
      mintInfoA.decimals,
      mintInfoB.decimals,
      whirlpoolData.tickSpacing,
    );
    const upperTick = PriceMath.priceToInitializableTickIndex(
      upperPrice,
      mintInfoA.decimals,
      mintInfoB.decimals,
      whirlpoolData.tickSpacing,
    );

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
      const instructionsTickArrays = txPayloadTickArraysDecompiled.instructions;
      instructions = instructions.concat(instructionsTickArrays);
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
    throw new Error(`Failed to open center position: ${error.message}`);
  }
}
