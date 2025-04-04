import { Percentage } from '@orca-so/common-sdk';
import { Wallet } from '@coral-xyz/anchor';
import {
  buildWhirlpoolClient,
  ORCA_WHIRLPOOL_PROGRAM_ID,
  PDAUtil,
  WhirlpoolContext,
} from '@orca-so/whirlpools-sdk';
import {
  Keypair,
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import { Agent } from 'src/agent';
import { Action } from 'src/shared/types/actions';
import { z } from 'zod';
import { Tool } from 'langchain/tools';

export const OrcaClosePositionAction: Action = {
  name: 'ORCA_CLOSE_POSITION',
  similes: [
    'close orca position',
    'orca close position',
    'close orca liquidity position',
    'orca close liquidity position',
  ],
  description:
    'Close an existing Orca position in a liquidity pool and withdraw the funds.',
  examples: [
    [
      {
        input: {
          positionMint: 'positionMintAddress',
        },
        output: {
          status: 'success',
          message: 'Position closed successfully',
          txId: '2jg87stmvPygRXJrqfpydZQSzGJK9rKvawekzy5mzuEmSjRf8bCmiGpFH8iLa2YrQxtreWcK99319DVTpCJHYZfx',
        },
        explanation: 'Close an existing Orca position in a liquidity pool',
      },
    ],
  ],
  schema: z.object({
    positionMint: z.string(),
  }),
  handler: async (agent: Agent, input: Record<string, any>) => {
    try {
      const result = await orca_close_position(agent, input.positionMint);

      return {
        status: 'success',
        message: 'Position closed successfully',
        txId: result.txId,
      };
    } catch (error: any) {
      return {
        status: 'error',
        message: `Failed to close position: ${error.message}`,
      };
    }
  },
};

export class OrcaClosePositionTool extends Tool {
  name = 'ORCA_CLOSE_POSITION';
  description = `Close an existing liquidity position in an Orca Whirlpool.`;

  constructor(public agent: Agent) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);
      const result = await this.agent.orcaClosePosition(
        parsedInput.positionMint,
      );

      return JSON.stringify({
        status: 'success',
        message: 'Position closed successfully',
        txId: result.txId,
      });
    } catch (error: any) {
      return JSON.stringify({
        status: 'error',
        message: `Failed to close position: ${error.message}`,
        code: error.code || 'UNKNOWN_ERROR',
      });
    }
  }
}

export async function orca_close_position(
  agent: Agent,
  positionMint: string,
): Promise<{ txId: string }> {
  try {
    const wallet = new Wallet(agent.account);
    const ctx = WhirlpoolContext.from(
      agent.connection,
      wallet,
      ORCA_WHIRLPOOL_PROGRAM_ID,
    );

    const client = buildWhirlpoolClient(ctx);

    const positionAddress = PDAUtil.getPosition(
      ORCA_WHIRLPOOL_PROGRAM_ID,
      new PublicKey(positionMint),
    );

    const position = await client.getPosition(positionAddress.publicKey);
    const whirlpoolAddress = position.getData().whirlpool;
    const whirlpool = await client.getPool(whirlpoolAddress);
    const txBuilder = await whirlpool.closePosition(
      positionAddress.publicKey,
      Percentage.fromFraction(1, 100),
    );
    const txPayload = await txBuilder[0].build();
    const txPayloadDecompiled = TransactionMessage.decompile(
      (txPayload.transaction as VersionedTransaction).message,
    );
    const instructions = txPayloadDecompiled.instructions;
    const signers = txPayload.signers as Keypair[];

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
    };
  } catch (error: any) {
    throw new Error(`Failed to close position: ${error.message}`);
  }
}
