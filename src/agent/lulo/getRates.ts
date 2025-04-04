import axios from "axios";
import { Action } from 'src/shared/types/actions';
import { Tool } from "langchain/tools";
import { Agent } from 'src/agent';
import { LULO_API_URI } from "src/shared/constants";
import { z } from "zod";

export const LuloGetRatesAction: Action = {
  name: 'LULO_GET_RATES',
  similes: [
    'get lulo rates',
    'fetch lulo rates',
  ],
  description: 'Fetch all rates on Lulo',
  examples: [
    [
      {
        input: {},
        output: {
          status: 'success',
          message: 'Rates fetched successfully',
          rates: {
            "regular": {
              "CURRENT": 5.361737287044537,
              "1HR": 5.352833333333333,
              "1YR": 6.149049862132353,
              "24HR": 5.219689655172414,
              "30DAY": 6.149049862132353,
              "7DAY": 5.356581602373887
            },
            "protected": {
              "CURRENT": 3.3912778882139367,
              "1HR": 3.385666666666667,
              "1YR": 3.4463903952205883,
              "24HR": 3.3047724137931036,
              "30DAY": 3.4463903952205883,
              "7DAY": 3.40368743818002
            },
          },
        },
        explanation: 'Fetch all rates on Lulo',
      },
    ],
  ],
  schema: z.object({}),
  handler: async (agent: Agent) => {
    try {
      const result = await lulo_get_rates(agent);
      return {
        status: 'success',
        message: 'Rates fetched successfully',
        rates: result,
      };
    } catch (error: any) {
      return {
        status: 'error',
        message: `Fetching Lulo account failed: ${error.message}`,
      };
    }
  },
};

export class LuloGetRatesTool extends Tool {
  name = 'LULO_GET_RATES';
  description = `
    List all rates on Lulo
  `;

  constructor(private agent: Agent) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      const rates = await this.agent.luloGetRates();

      return JSON.stringify({
        status: 'success',
        message: 'Rates fetched successfully',
        rates: rates,
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

export async function lulo_get_rates(
  agent: Agent,
): Promise<LuloRateData> {
  try {
    const client = axios.create({
      baseURL: LULO_API_URI,
    });

    const response = await client.get(`/v1/rates.getRates`,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': agent.config?.LULO_API_KEY ?? '',
        },
      },
    );

    const result = response.data
    return result;
  } catch (error: any) {
    throw new Error(`Failed to get rates: ${error.message}`);
  }
}

type LuloRateData = {
  regular: {
    CURRENT: number;
    "1HR": number;
    "1YR": number;
    "24HR": number;
    "30DAY": number;
    "7DAY": number;
  };
  protected: {
    CURRENT: number;
    "1HR": number;
    "1YR": number;
    "24HR": number;
    "30DAY": number;
    "7DAY": number;
  };
};

// {
//   "regular": {
//     "CURRENT": 5.361737287044537,
//     "1HR": 5.352833333333333,
//     "1YR": 6.149049862132353,
//     "24HR": 5.219689655172414,
//     "30DAY": 6.149049862132353,
//     "7DAY": 5.356581602373887
//   },
//   "protected": {
//     "CURRENT": 3.3912778882139367,
//     "1HR": 3.385666666666667,
//     "1YR": 3.4463903952205883,
//     "24HR": 3.3047724137931036,
//     "30DAY": 3.4463903952205883,
//     "7DAY": 3.40368743818002
//   }
// }