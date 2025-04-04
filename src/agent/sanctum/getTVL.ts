import { Action } from 'src/shared/types/actions';
import { z } from 'zod';
import { Tool } from 'langchain/tools';
import { Agent } from 'src/agent';
import axios from 'axios';
import { SANCTUM_STAT_API_URI } from 'src/shared/constants';

export const SanctumGetTVLAction: Action = {
  name: 'SANCTUM_GET_TVL',
  similes: [
    'get sanctum pool TVL',
    'get sanctum pool liquidity',
    'get sanctum pool value',
    'fetch sanctum pool TVL',
    'fetch sanctum pool liquidity',
    'fetch sanctum pool value',
  ],
  description:
    'Fetch the TVL of a LST(Liquid Staking Token) on Sanctum with specified mint addresses or symbols',
  examples: [
    [
      {
        input: {
          inputs: [
            'INF',
            'pwrsol',
            'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
            'laineSOL',
          ],
        },
        output: {
          pwrsol: 0.08321988140942367,
          laineSOL: 0.0831767225669587,
          INF: 0.06542961909093714,
          mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So: 0.08143705823579084,
        },
        explanation: 'Fetch the TVL of LSTs on Sanctum',
      },
    ],
  ],
  schema: z.object({
    inputs: z.array(z.string()),
  }),
  handler: async (input: Record<string, any>) => {
    try {
      const tvls = await sanctum_get_tvl(input.inputs);

      return {
        status: 'success',
        message: 'TVL fetched successfully',
        tvls,
      };
    } catch (error: any) {
      return {
        status: 'error',
        message: `Fetching Sanctum LST TVL failed: ${error.message}`,
      };
    }
  },
};

export class SanctumGetTVLTool extends Tool {
  name = 'SANCTUM_GET_TVL';
  description = `Fetch the TVL of a LST(Liquid Staking Token) list on the Sanctum with specified mint addresses or symbols.
  
  Inputs (input is a JSON string):
  inputs: string[], eg ["INF", "pwrsol", "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So", "laineSOL"] (required)
  `;

  constructor(private agent: Agent) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      const tvls = await this.agent.sanctumGetTVL(parsedInput.inputs);

      return JSON.stringify({
        status: 'success',
        message: 'TVL fetched successfully',
        tvls,
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

export async function sanctum_get_tvl(
  inputs: string[],
): Promise<{ tvls: Record<string, string> }> {
  try {
    const client = axios.create({
      baseURL: SANCTUM_STAT_API_URI,
    });

    const response = await client.get('/v1/tvl/current', {
      params: {
        lst: inputs,
      },
      paramsSerializer: (params) => {
        return params.lst.map((value: string) => `lst=${value}`).join('&');
      },
    });

    const result = response.data.tvls;

    return result;
  } catch (error: any) {
    throw new Error(`Failed to get tvl: ${error.message}`);
  }
}
