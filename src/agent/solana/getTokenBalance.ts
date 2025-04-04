import { Action } from 'src/shared/types/actions';
import { z } from 'zod';
import { Agent } from 'src/agent';
import { Tool } from 'langchain/tools';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';
import { getTokenMetadata } from 'src/shared/handler/token';

export const SolanaGetTokenBalanceAction: Action = {
  name: 'SOLANA_GET_TOKEN_BALANCE',
  similes: [
    'get solana token balance',
    'fetch solana token balance',
    'get spl token balance',
    'fetch spl token balance',
  ],
  description:
    'Get the balance of a Solana SPL token balance with specified SPL token address',

  examples: [
    [
      {
        input: {
          tokenAddress: '7Uuzh9JwqF8z3u6MWpQuQJbpD1u46xPDY6PGjwfwTh4o',
        },
        output: {
          status: 'success',
          message: 'Token balance fetched successfully',
          balance: '1000000000',
          decimals: 6,
          name: 'Homo Memetus',
          symbol: 'HOMO',
        },
        explanation:
          'Get the balance of SPL token with specified SPL token address',
      },
    ],
  ],
  schema: z.object({
    tokenAddress: z.string(),
  }),
  handler: async (agent: Agent, input: Record<string, any>) => {
    try {
      const result = await solana_get_token_balance(agent, input.tokenAddress);

      return {
        status: 'success',
        message: 'Get token balance successfully',
        balance: result.balance,
        decimals: result.decimals,
        name: result.name,
        symbol: result.symbol,
      };
    } catch (error: any) {
      return {
        status: 'error',
        message: `Failed to get SPL token balance: ${error.message}`,
      };
    }
  },
};

export class SolanaGetTokenBalanceTool extends Tool {
  name = 'SOLANA_GET_TOKEN_BALANCE';
  description = `Get the balance of a Solana SPL token balance with specified SPL token address
  
  Inputs (input is a JSON string):
  tokenAddress: string, eg "7Uuzh9JwqF8z3u6MWpQuQJbpD1u46xPDY6PGjwfwTh4o" (required)
`;
  constructor(private agent: Agent) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      const result = await this.agent.solanaGetTokenBalance(
        parsedInput.tokenAddress,
      );

      return JSON.stringify({
        status: 'success',
        message: 'Token balance fetched successfully',
        balance: result.balance,
        decimals: result.decimals,
        name: result.name,
        symbol: result.symbol,
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

export async function solana_get_token_balance(
  agent: Agent,
  tokenAddress: string,
): Promise<{
  balance: string;
  decimals: number;
  name: string;
  symbol: string;
}> {
  try {
    const connection = agent.connection;
    const ata = await getAssociatedTokenAddress(
      new PublicKey(tokenAddress),
      agent.account.publicKey,
    );

    const result = await connection.getParsedAccountInfo(ata);
    const mintInfo = await getTokenMetadata(connection, tokenAddress);

    if (
      result.value?.data &&
      'parsed' in result.value.data &&
      'info' in result.value.data.parsed
    ) {
      return {
        name: mintInfo.name ?? '',
        symbol: mintInfo.symbol ?? '',
        balance:
          result.value.data.parsed.info.tokenAmount.uiAmount.toString() as string,
        decimals: result.value.data.parsed.info.tokenAmount.decimals as number,
      };
    }
    return {
      name: mintInfo.name ?? '',
      symbol: mintInfo.symbol ?? '',
      balance: '0',
      decimals: 0,
    };
  } catch (error: any) {
    console.error(error);
    throw new Error(`Failed to get SPL token balance: ${error.message}`);
  }
}
