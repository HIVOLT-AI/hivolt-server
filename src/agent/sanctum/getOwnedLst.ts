import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { Action } from 'src/shared/types/actions';
import { Agent } from 'src/agent';
import { z } from 'zod';
import { Tool } from 'langchain/tools';
import { SANCTUM_STAT_API_URI } from 'src/shared/constants';
import axios from 'axios';

export const SanctumGetOwnedLst: Action = {
  name: 'SANCTUM_GET_OWNED_LST',
  similes: [
    'get owned lst',
    'get owned liquid staking tokens',
    'fetch owned lst',
    'fetch owned liquid staking tokens',
  ],
  description:
    'Fetch the owned LST(Liquid Staking Token) on Sanctum with specified account',
  examples: [
    [
      {
        input: {},
        output: {
          lsts: [
            {
              tokenAddress: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
              decimals: 9,
              balance: 0.0035,
            },
          ],
        },
        explanation: 'Fetch the owned LSTs on Sanctum',
      },
    ],
  ],
  schema: z.object({}),
  handler: async (agent: Agent) => {
    try {
      const result = await sanctum_get_owned_lst(agent);

      return {
        status: 'success',
        message: 'Owned LSTs fetched successfully',
        lsts: result,
      };
    } catch (error: any) {
      return {
        status: 'error',
        message: `Fetching owned LSTs failed: ${error.message}`,
      };
    }
  },
};

export class SanctumGetOwnedLstTool extends Tool {
  name = 'SANCTUM_GET_OWNED_LST';
  description = `Fetch the owned LST(Liquid Staking Token) on Sanctum with specified account`;

  constructor(private agent: Agent) {
    super();
  }

  protected async _call(): Promise<string> {
    try {
      const result = await this.agent.sanctumGetOwnedLst();

      return JSON.stringify({
        status: 'success',
        message: 'Owned LSTs fetched successfully',
        lsts: result,
      });
    } catch (error: any) {
      return JSON.stringify({
        status: 'error',
        message: `Fetching owned LSTs failed: ${error.message}`,
      });
    }
  }
}

export async function sanctum_get_owned_lst(agent: Agent): Promise<
  {
    tokenAddress: string;
    decimals: number;
    balance: number;
  }[]
> {
  try {
    const [tokenAccountData] = await Promise.all([
      agent.connection.getParsedTokenAccountsByOwner(agent.account.publicKey, {
        programId: TOKEN_PROGRAM_ID,
      }),
    ]);

    const removedZeroBalance = tokenAccountData.value.filter(
      (v) => v.account.data.parsed.info.tokenAmount.uiAmount !== 0,
    );

    const tokens = await Promise.all(
      removedZeroBalance.map(async (v) => {
        return {
          tokenAddress: v.account.data.parsed.info.mint as string,
          decimals: v.account.data.parsed.info.tokenAmount.decimals as number,
          balance: v.account.data.parsed.info.tokenAmount.uiAmount as number,
        };
      }),
    );

    const lsts = tokens.filter((token) => {
      return token.decimals === 9;
    });

    const addresses = lsts.map((token) => token.tokenAddress);

    const client = axios.create({
      baseURL: SANCTUM_STAT_API_URI,
    });

    const response = await client.get('/v1/sol-value/current', {
      params: {
        lst: addresses,
      },
      paramsSerializer: (params) => {
        return params.lst.map((value: string) => `lst=${value}`).join('&');
      },
    });

    const result = Object.keys(response.data.solValues);

    const lstsWithValue = lsts.filter((lst) => {
      return result.includes(lst.tokenAddress);
    });

    return lstsWithValue;
  } catch (error: any) {
    throw new Error(`Fetching owned LSTs failed: ${error.message}`);
  }
}
