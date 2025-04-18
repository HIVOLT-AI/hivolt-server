import { Action } from 'src/shared/types/actions';
import { z } from 'zod';
import { Tool } from 'langchain/tools';
import { Agent } from 'src/agent';
import axios from 'axios';
import { SANCTUM_TRADE_API_URI } from 'src/shared/constants';
import {
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';

export const SanctumRemoveLiquidityAction: Action = {
  name: 'SANCTUM_REMOVE_LIQUIDITY',
  similes: [
    'remvoe liquidity from sanctum pool',
    'withdraw from sanctum pool',
    'remove liquidity from infinite pool',
    'withdraw from infinite pool',
  ],
  description:
    'Remove liquidity from sanctum infinite pool with specified token parameters',
  examples: [
    [
      {
        input: {
          lstMint: 'So11111111111111111111111111111111111111112',
          amount: '1000000000',
          quotedAmount: '900000000',
          priorityFee: 5000,
        },
        output: {
          status: 'success',
          message: 'Liquidity removed successfully',
          txId: '2FqduazbmVrYAs6VMj7whKvFhEJnCyCvm7GiX4xCj1FSVr4CquPqFoCPDokUuJJ3T24EpXLPxrJWmGq6EnpsrJWf',
        },
        explanation: 'Remove liquidity from a Sanctum pool',
      },
    ],
  ],
  schema: z.object({
    lstMint: z.string(),
    amount: z.string(),
    quotedAmount: z.string(),
    priorityFee: z.number(),
  }),
  handler: async (agent: Agent, input: Record<string, any>) => {
    try {
      const result = await sanctum_remove_liquidity(
        agent,
        input.lstMint,
        input.amount,
        input.quotedAmount,
        input.priorityFee,
      );

      return {
        status: 'success',
        message: 'Liquidity removed successfully',
        txId: result.txId,
      };
    } catch (error: any) {
      return {
        status: 'error',
        message: `Removing liquidity from Sanctum pool failed: ${error.message}`,
      };
    }
  },
};

export class SanctumRemoveLiquidityTool extends Tool {
  name = 'SANCTUM_REMOVE_LIQUIDITY';
  description = `Remove liquidity from Sanctum infinite pool.
  
  Inputs (input is a JSON string):
  lstMint: string, eg "So11111111111111111111111111111111111111112" (required)
  amount: string, eg "1000000000" (required)
  quotedAmount: string, eg "900000000" (required)
  priorityFee: number, eg 5000 (required)
  `;

  constructor(private agent: Agent) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      const result = await this.agent.sanctumRemoveLiquidity(
        parsedInput.lstMint,
        parsedInput.amount,
        parsedInput.quotedAmount,
        parsedInput.priorityFee,
      );

      return JSON.stringify({
        status: 'success',
        message: 'Liquidity removed successfully',
        txId: result.txId,
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

export async function sanctum_remove_liquidity(
  agent: Agent,
  lstMint: string,
  amount: string,
  quotedAmount: string,
  priorityFee: number,
): Promise<{ txId: string }> {
  try {
    const client = axios.create({
      baseURL: SANCTUM_TRADE_API_URI,
    });

    const response = await client.post('/v1/liquidity/remove', {
      amount,
      dstLstAcc: null,
      lstMint,
      priorityFee: {
        Auto: {
          max_unit_price_micro_lamports: priorityFee,
          unit_limit: 300000,
        },
      },
      quotedAmount,
      signer: agent.account.publicKey.toBase58(),
      srcLstAcc: null,
    });

    const txBuffer = Buffer.from(response.data.tx, 'base64');
    const { blockhash } = await agent.connection.getLatestBlockhash();

    const tx = VersionedTransaction.deserialize(txBuffer);

    const messages = tx.message;

    const instructions = messages.compiledInstructions.map((ix) => {
      return new TransactionInstruction({
        programId: messages.staticAccountKeys[ix.programIdIndex],
        keys: ix.accountKeyIndexes.map((i) => ({
          pubkey: messages.staticAccountKeys[i],
          isSigner: messages.isAccountSigner(i),
          isWritable: messages.isAccountWritable(i),
        })),
        data: Buffer.from(ix.data as any, 'base64'),
      });
    });

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

    return { txId };
  } catch (error: any) {
    throw new Error(`Remove Liquidity failed: ${error.message}`);
  }
}
