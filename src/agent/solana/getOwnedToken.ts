import { Action } from 'src/shared/types/actions';
import { z } from 'zod';
import { Agent } from 'src/agent';
import { Tool } from 'langchain/tools';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { getTokenMetadata } from 'src/shared/handler/token';

export const SolanaGetOwnedTokenAction: Action = {
  name: 'SOLANA_GET_OWNED_TOKEN',
  similes: ['get owned SPL token', 'fetch owned SPL token'],
  description: 'Get the owned SPL token of a Solana account',
  examples: [
    [
      {
        input: {},
        output: {
          status: 'success',
          message: 'Owned SPL token fetched successfully',
          tokens: [
            {
              name: 'Homo Memetus',
              symbol: 'HOMO',
              balance: '10000000',
              decimals: 6,
            },
          ],
        },
        explanation: 'Get the owned SPL token of a Solana account',
      },
    ],
  ],
  schema: z.object({}),
  handler: async (agent: Agent) => {
    try {
      const tokens = await solana_get_owned_token(agent);

      return {
        status: 'success',
        message: 'Get owned token successfully',
        tokens,
      };
    } catch (error: any) {
      return {
        status: 'error',
        message: `Failed to get owned SPL token of a Solana account: ${error.message}`,
      };
    }
  },
};

export class SolanaGetOwnedTokenTool extends Tool {
  name = 'SOLANA_GET_OWNED_TOKEN';
  description = `Get the owned SPL token of a Solana account`;

  constructor(private agent: Agent) {
    super();
  }

  protected async _call(): Promise<string> {
    try {
      const result = await this.agent.solanaGetOwnedToken();

      return JSON.stringify({
        status: 'success',
        message: 'Get owned token successfully',
        tokens: result,
      });
    } catch (error: any) {
      return JSON.stringify({
        status: 'error',
        message: `Fetching owned SPL token failed: ${error.message}`,
        code: error.code || 'UNKNOWN_ERROR',
      });
    }
  }
}

export async function solana_get_owned_token(agent: Agent) {
  try {
    const connection = agent.connection;

    const [tokenAccountData] = await Promise.all([
      connection.getParsedTokenAccountsByOwner(agent.account.publicKey, {
        programId: TOKEN_PROGRAM_ID,
      }),
    ]);

    const filterZeroqBalance = tokenAccountData.value.filter((v) => {
      v.account.data.parsed.info.tokenAmount.uiAmount !== 0;
    });

    const tokenBalances = await Promise.all(
      filterZeroqBalance.map(async (v) => {
        const mint = v.account.data.parsed.info.mint;
        const mintInfo = await getTokenMetadata(connection, mint);
        return {
          name: mintInfo.name ?? '',
          symbol: mintInfo.symbol ?? '',
          balance: v.account.data.parsed.info.tokenAmount.uiAmount as string,
          decimals: v.account.data.parsed.info.tokenAmount.decimals as number,
        };
      }),
    );

    return tokenBalances;
  } catch (error: any) {
    console.error(error);
    throw new Error(
      `Failed to get owned SPL token of a Solana account: ${error.message}`,
    );
  }
}
