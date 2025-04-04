import { Action } from 'src/shared/types/actions';
import { z } from 'zod';
import { Agent } from 'src/agent';
import { Tool } from 'langchain/tools';
import { PublicKey, Transaction } from '@solana/web3.js';
import {
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAccount,
  getAssociatedTokenAddress,
  getMint,
} from '@solana/spl-token';

export const SolanaTransferTokenAction: Action = {
  name: 'SOLANA_TRANSFER_TOKEN',
  similes: [
    'transfer solana SPL token',
    'send solana SPL token',
    'move solana SPL token',
  ],
  description:
    'Transfer a SPL token from one Solana account to specified another account',
  examples: [
    [
      {
        input: {
          to: '3fDDwaH8tHfmLUKi5visWy4xQBhUNKYwwoVwz5uQGqAZ',
          amount: '10000000',
          tokenAddress: '7Uuzh9JwqF8z3u6MWpQuQJbpD1u46xPDY6PGjwfwTh4o',
        },
        output: {
          status: 'success',
          message: 'Token transferred successfully',
          txId: '2vNhfCobCY1D8Hpt1TVP7fJuKSBt5YDZkBVS8ZSmYrRg2Nyz6p5twJLDBEbi68H5J1oMYFP3ofV9aCocrnQPnjod',
        },
        explanation: 'Transfer SPL token to another account',
      },
    ],
  ],
  schema: z.object({
    to: z.string(),
    amount: z.string(),
    tokenAddress: z.string(),
  }),
  handler: async (agent: Agent, input: Record<string, any>) => {
    try {
      const result = await solana_transfer_token(
        agent,
        input.to,
        input.amount,
        input.tokenAddress,
      );

      return {
        status: 'success',
        message: 'Token transferred successfully',
        txId: result,
      };
    } catch (error: any) {
      return {
        status: 'error',
        message: `Failed to transfer SPL token: ${error.message}`,
      };
    }
  },
};

export class SolanaTransferTokenTool extends Tool {
  name = 'SOLANA_TRANSFER_TOKEN';
  description = `Transfer a SPL token from one Solana account to specified another account 
  
  Inputs (input is a JSON string):
  to: string, eg "" (required)
  amount: string, eg "10000000" (required)
  tokenAddress: string, eg "7Uuzh9JwqF8z3u6MWpQuQJbpD1u46xPDY6PGjwfwTh4o" (required)`;

  constructor(private agent: Agent) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      const result = await this.agent.solanaTransferToken(
        parsedInput.to,
        parsedInput.amount,
        parsedInput.tokenAddress,
      );

      return JSON.stringify({
        status: 'success',
        message: 'Token transferred successfully',
        txId: result,
      });
    } catch (error: any) {
      return JSON.stringify({
        status: 'error',
        message: `Failed to transfer SPL token: ${error.message}`,
        code: error.code || 'UNKNOWN_ERROR',
      });
    }
  }
}

export async function solana_transfer_token(
  agent: Agent,
  to: string,
  amount: string,
  tokenAddress: string,
): Promise<string> {
  try {
    const connection = agent.connection;
    const transaction = new Transaction();

    const fromAta = await getAssociatedTokenAddress(
      new PublicKey(tokenAddress),
      agent.account.publicKey,
    );

    const toAta = await getAssociatedTokenAddress(
      new PublicKey(tokenAddress),
      new PublicKey(to),
    );

    try {
      await getAccount(connection, toAta);
    } catch {
      transaction.add(
        createAssociatedTokenAccountInstruction(
          agent.account.publicKey,
          toAta,
          new PublicKey(to),
          new PublicKey(tokenAddress),
        ),
      );
    }

    const mintInfo = await getMint(connection, new PublicKey(tokenAddress));

    const newAmount = parseInt(amount) * Math.pow(10, mintInfo.decimals);

    transaction.add(
      createTransferInstruction(
        fromAta,
        toAta,
        agent.account.publicKey,
        newAmount,
      ),
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
    console.log(error);
    throw new Error(`Failed to transfer SPL token: ${error.message}`);
  }
}
