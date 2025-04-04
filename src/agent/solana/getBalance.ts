import { Action } from 'src/shared/types/actions';
import { z } from 'zod';
import { Tool } from 'langchain/tools';
import { Agent } from 'src/agent';

export const SolanaGetBalanceAction: Action = {
  name: 'SOLANA_GET_BALANCE',
  similes: [
    'get solana balance',
    'fetch solana balance',
    'get sol balance',
    'fetch sol balance',
  ],
  description: 'Get the balance of a Solana account',
  examples: [
    [
      {
        input: {},
        output: {
          status: 'success',
          message: 'Balance fetched successfully',
          balance: '1000000000',
        },
        explanation: 'Get the balance of the account.',
      },
    ],
  ],
  schema: z.object({}),
  handler: async (agent: Agent) => {
    try {
      const balance = await solana_get_balance(agent);

      return {
        status: 'success',
        message: 'Balance fetched successfully',
        balance,
      };
    } catch (error: any) {
      return {
        status: 'error',
        message: `Fetching Solana balance failed: ${error.message}`,
      };
    }
  },
};

export class SolanaGetBalanceTool extends Tool {
  name = 'SOLANA_GET_BALANCE';
  description = `Get the balance of a Solana account`;

  constructor(private agent: Agent) {
    super();
  }

  protected async _call(): Promise<string> {
    try {
      const result = await this.agent.solanaGetBalance();

      return JSON.stringify({
        status: 'success',
        message: 'Balance fetched successfully',
        balance: result,
      });
    } catch (error: any) {
      return JSON.stringify({
        status: 'error',
        message: `Fetching Solana balance failed: ${error.message}`,
        code: error.code || 'UNKNOWN_ERROR',
      });
    }
  }
}

export async function solana_get_balance(agent: Agent): Promise<number> {
  try {
    const connection = agent.connection;

    const balance = await connection.getBalance(agent.account.publicKey);

    return balance;
  } catch (error: any) {
    console.error(error);
    throw new Error(`Failed to get Solana balance: ${error.message}`);
  }
}
