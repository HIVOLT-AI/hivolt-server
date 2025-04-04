import { Action } from 'src/shared/types/actions';
import { z } from 'zod';
import { Tool } from 'langchain/tools';
import { Agent } from 'src/agent';
import axios from 'axios';
import { SANCTUM_STAT_API_URI } from 'src/shared/constants';

export const SanctumGetPriceAction: Action = {
  name: 'SANCTUM_GET_PRICE',
  similes: [
    'get sanctum lst price',
    'get sanctum lst value',
    'get sanctum lst rate',
    'fetch sanctum lst price',
    'fetch sanctum lst value',
    'fetch sanctum lst rate',
  ],
  description:
    'Fetch the price of a LST(Liquid Staking Token) on Sanctum with specified mint addresses or symbols',
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
      const prices = await sanctum_get_price(input.inputs);

      return {
        status: 'success',
        message: 'Price fetched successfully',
        prices,
      };
    } catch (error: any) {
      return {
        status: 'error',
        message: `Fetching Sanctum LST price failed: ${error.message}`,
      };
    }
  },
};

export class SanctumGetPriceTool extends Tool {
  name = 'SANCTUM_GET_PRICE';
  description = `Fetch the price of a LST(Liquid Staking Token) list on the Sanctum with specified mint addresses or symbols.
  
  Inputs (input is a JSON string):
  inputs: string[], eg ["INF", "pwrsol", "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So", "laineSOL"] (required)
  `;

  constructor(private agent: Agent) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      const prices = await this.agent.sanctumGetPrice(parsedInput.inputs);

      return JSON.stringify({
        status: 'success',
        message: 'Price fetched successfully',
        prices,
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

export async function sanctum_get_price(
  inputs: string[],
): Promise<{ mint: string; amount: number }[]> {
  try {
    const client = axios.create({
      baseURL: SANCTUM_STAT_API_URI,
    });

    const response = await client.get('/v1/sol-value/current', {
      params: {
        lst: inputs,
      },
      paramsSerializer: (params) => {
        return params.lst.map((value: string) => `lst=${value}`).join('&');
      },
    });

    const result = response.data.solValues;

    return result;
  } catch (error: any) {
    throw new Error(`Failed to get price: ${error.message}`);
  }
}
