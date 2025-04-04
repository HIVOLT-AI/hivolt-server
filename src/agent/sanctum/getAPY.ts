import { Action } from 'src/shared/types/actions';
import { z } from 'zod';
import { Tool } from 'langchain/tools';
import { Agent } from 'src/agent';
import axios from 'axios';
import { SANCTUM_STAT_API_URI } from 'src/shared/constants';

export const SanctumGetAPYAction: Action = {
  name: 'SANCTUM_GET_APY',
  similes: [
    'get sanctum pool APY',
    'get sanctum pool yield',
    'get sanctum pool return',
    'get sanctum pool profit',
    'get sanctum pool earnings',
    'fetch sanctum pool APY',
    'fetch sanctum pool yield',
    'fetch sanctum pool return',
    'fetch sanctum pool profit',
    'fetch sanctum pool earnings',
  ],
  description:
    'Fetch the APY of a LST(Liquid Staking Token) on Sanctum with specified mint addresses or symbols',
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
        explanation: 'Fetch the APY of LSTs on Sanctum',
      },
    ],
  ],
  schema: z.object({
    inputs: z.array(z.string()),
  }),
  handler: async (input: Record<string, any>) => {
    try {
      const apys = await sanctum_get_apy(input.inputs);

      return {
        status: 'success',
        message: 'APY fetched successfully',
        apys,
      };
    } catch (error: any) {
      return {
        status: 'error',
        message: `Fetching Sanctum LST APY failed: ${error.message}`,
      };
    }
  },
};

export class SanctumGetAPYTool extends Tool {
  name = 'SANCTUM_GET_APY';
  description = `Fetch the APY of a LST(Liquid Staking Token) list on the Sanctum with specified mint addresses or symbols.
  
  Inputs (input is a JSON string):
  inputs: string[], eg ["INF", "pwrsol", "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So", "laineSOL"] (required)
  `;

  constructor(private agent: Agent) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      const apys = await this.agent.sanctumGetAPY(parsedInput.inputs);

      return JSON.stringify({
        status: 'success',
        message: 'APY fetched successfully',
        apys,
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

export async function sanctum_get_apy(
  inputs: string[],
): Promise<{ apys: Record<string, number> }> {
  try {
    const client = axios.create({
      baseURL: SANCTUM_STAT_API_URI,
    });

    const response = await client.get('/v1/apy/latest', {
      params: {
        lst: inputs,
      },
      paramsSerializer: (params) => {
        return params.lst.map((value: string) => `lst=${value}`).join('&');
      },
    });

    const result = response.data.apys;

    return result;
  } catch (error: any) {
    throw new Error(`Failed to get apy: ${error.message}`);
  }
}
