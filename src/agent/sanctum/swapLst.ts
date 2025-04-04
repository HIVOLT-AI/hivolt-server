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

export const SanctumLSTSwapAction: Action = {
  name: 'SANCTUM_LST_SWAP',
  similes: [
    'swap sanctum lst',
    'swap sanctum token',
    'exchange sanctum lst',
    'exchange sanctum token',
  ],
  description:
    'Swap LST(Liquid Staking Token) on Sanctum with specified token peramters',
  examples: [
    [
      {
        input: {
          input: 'So11111111111111111111111111111111111111112',
          amount: '1000000000',
          quotedAmount: '900000000',
          priorityFee: 5000,
          outputLstMint: 'bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1',
        },
        output: {
          status: 'success',
          message: 'Swap executed successfully',
          txId: '2jg87stmvPygRXJrqfpydZQSzGJK9rKvawekzy5mzuEmSjRf8bCmiGpFH8iLa2YrQxtreWcK99319DVTpCJHYZfx',
        },
        explanation: 'Swap LST on Sanctum',
      },
    ],
  ],
  schema: z.object({
    input: z.string(),
    amount: z.string(),
    quotedAmount: z.string(),
    priorityFee: z.number(),
    outputLstMint: z.string(),
  }),
  handler: async (agent: Agent, input: Record<string, any>) => {
    try {
      const result = await sanctum_lst_swap(
        agent,
        input.input,
        input.amount,
        input.quotedAmount,
        input.priorityFee,
        input.outputLstMint,
      );

      return {
        status: 'success',
        message: 'Swap executed successfully',
        txId: result.txId,
      };
    } catch (error: any) {
      return {
        status: 'error',
        message: `Swapping Sanctum LST failed: ${error.message}`,
      };
    }
  },
};

export class SanctumLSTSwapTool extends Tool {
  name = 'SANCTUM_LST_SWAP';
  description = `Swap LST(Liquid Staking Token) on Sanctum with specified token peramters.
    
  Inputs (input is a JSON string):
  input: string, eg "So11111111111111111111111111111111111111112" (required)
  amount: string, eg "1000000000" (required)
  quotedAmount: string, eg "900000000" (required)
  priorityFee: number, eg 5000 (required)
  outputLstMint: string, eg "bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1" (required)
  `;

  constructor(private agent: Agent) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      const result = await this.agent.sanctumLSTSwap(
        parsedInput.input,
        parsedInput.amount,
        parsedInput.quotedAmount,
        parsedInput.priorityFee,
        parsedInput.outputLstMint,
      );

      return JSON.stringify({
        status: 'success',
        message: 'Swap executed successfully',
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

export async function sanctum_lst_swap(
  agent: Agent,
  input: string,
  amount: string,
  quotedAmount: string,
  priorityFee: number,
  outputLstMint: string,
): Promise<{ txId: string }> {
  try {
    const client = axios.create({
      baseURL: SANCTUM_TRADE_API_URI,
    });

    const response = await client.post('/v1/swap', {
      amount,
      dstLstAcc: null,
      input,
      mode: 'ExactIn',
      priorityFee: {
        Auto: {
          max_unit_price_micro_lamports: priorityFee,
          unit_limit: 300000,
        },
      },
      outputLstMint,
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
  } catch (error) {
    console.error(error);
    throw new Error(`Sanctum LST swap failed: ${error.message}`);
  }
}
