import { TransactionInstruction, TransactionMessage, VersionedTransaction } from '@solana/web3.js';
import axios from 'axios';
import { Tool } from 'langchain/tools';
import { Agent } from 'src/agent';
import { LULO_API_URI } from 'src/shared/constants';
import { Action } from 'src/shared/types/actions';
import { z } from 'zod';

export const LuloWithdrawProtectedAction: Action = {
  name: 'LULO_WITHDRAW_PROTECTED',
  similes: ['withdraw USDC from protected Lulo'],
  description: 'withdraw USDC from protected Lulo',
  examples: [
    [
      {
        input: {
          mintAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          amount: 150,
        },
        output: {
          status: 'success',
          message: 'USDC withdrawal from protected Lulo successful',
          txId: '2jg87stmvPygRXJrqfpydZQSzGJK9rKvawekzy5mzuEmSjRf8bCmiGpFH8iLa2YrQxtreWcK99319DVTpCJHYZfx',
        },
        explanation: 'Withdraw USDC from protected Lulo',
      },
    ]
  ],
  schema: z.object({
    mintAddress: z.string(),
    amount: z.number(),
  }),
  handler: async (agent: Agent, input: Record<string, any>) => {
    try {
      const result = await lulo_withdraw_protected(agent, input.mintAddress, input.amount);

      return {
        status: 'success',
        message: 'USDC withdrawal from protected Lulo successful',
        txId: result.txId,
      };
    } catch (error: any) {
      return {
        status: 'error',
        message: `failed to withdraw USDC from protected Lulo: ${error.message}`,
      };
    }
  },
};

export class LuloWithdrawProtectedTool extends Tool {
  name = 'LULO_WITHDRAW_PROTECTED';
  description = `Withdraw USDC from protected Lulo.
  
  Inputs (input is a JSON string):
  mintAddress: string, eg "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" (required)
  amount: number, eg 150 (required)
  `;

  constructor(private agent: Agent) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      const result = await this.agent.luloWithdrawProtected(
        parsedInput.mintAddress,
        parsedInput.amount,
      );

      return JSON.stringify({
        status: 'success',
        message: 'USDC withdrawal from protected Lulo successful',
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

export async function lulo_withdraw_protected(
   agent: Agent,
   mintAddress: string,
   amount: number,
): Promise<{ txId: string }> {
  try {
    const client = axios.create({
      baseURL: LULO_API_URI,
    });
    const response = await client.post('/v1/generate.transactions.withdrawProtected?priorityFee=500000', {
      owner: agent.account.publicKey.toBase58(),
      mintAddress: mintAddress, // USDC: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
      amount: amount,
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': agent.config?.LULO_API_KEY ?? '',
      },
    });

    const txBuffer = Buffer.from(response.data.trasnaction, 'base64');
    const tx = VersionedTransaction.deserialize(txBuffer);
    const { blockhash } = await agent.connection.getLatestBlockhash();

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
    throw new Error(`Failed to withdraw USDC from protected Lulo: ${error.message}`);
  }
}
