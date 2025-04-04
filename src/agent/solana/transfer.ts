import { Action } from 'src/shared/types/actions';
import { z } from 'zod';
import { Agent } from 'src/agent';
import { Tool } from 'langchain/tools';
import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js';

export const SolanaTransferAction: Action = {
  name: 'SOLANA_TRANSFER',
  similes: [
    'transfer SOL to another account',
    'send SOL to another account',
    'move SOL to another account',
    'transfer SOL to given account',
    'send SOL to given account',
    'move SOL to given account',
  ],
  description: 'Transfer SOL to given sepecified another Solana account',
  examples: [
    [
      {
        input: {
          to: '3fDDwaH8tHfmLUKi5visWy4xQBhUNKYwwoVwz5uQGqAZ',
          amount: '1000000000',
        },
        output: {
          status: 'success',
          message: 'SOL transferred successfully',
          txId: '2vNhfCobCY1D8Hpt1TVP7fJuKSBt5YDZkBVS8ZSmYrRg2Nyz6p5twJLDBEbi68H5J1oMYFP3ofV9aCocrnQPnjod',
        },
        explanation: 'Transfer SOL to another Solana account',
      },
    ],
  ],
  schema: z.object({
    to: z.string(),
    amount: z.string(),
  }),
  handler: async (agent: Agent, input: Record<string, any>) => {
    try {
      const result = await solana_transfer(agent, input.to, input.amount);

      return {
        status: 'success',
        message: 'SOL transferred successfully',
        txId: result,
      };
    } catch (error: any) {
      return {
        status: 'error',
        message: `Failed to transfer SOL: ${error.message}`,
      };
    }
  },
};

export class SolanaTransferTool extends Tool {
  name = 'SOLANA_TRANSFER';
  description = `Transfer SOL to given sepecified another Solana account
  
  Inputs (input is a JSON string):
  to: string, eg "" (required)
  amount: string, eg "1000000000" (required)
  `;

  constructor(private agent: Agent) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      const result = await this.agent.solanaTransfer(
        parsedInput.to,
        parsedInput.amount,
      );

      return JSON.stringify({
        status: 'success',
        message: 'SOL transferred successfully',
        txId: result,
      });
    } catch (error: any) {
      return JSON.stringify({
        status: 'error',
        message: `Failed to transfer SOL: ${error.message}`,
      });
    }
  }
}

export async function solana_transfer(
  agent: Agent,
  to: string,
  amount: string,
): Promise<string> {
  try {
    const connection = agent.connection;

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: agent.account.publicKey,
        toPubkey: new PublicKey(to),
        lamports: parseInt(amount),
      }),
    );

    const txId: string = await connection.sendTransaction(
      transaction,
      [agent.account],
      {
        maxRetries: 3,
      },
    );

    return txId;
  } catch (error: any) {
    console.error(error);
    throw new Error(`Failed to transfer SOL: ${error.message}`);
  }
}
