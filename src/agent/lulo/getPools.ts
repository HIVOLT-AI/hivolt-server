import axios from "axios";
import { Action } from 'src/shared/types/actions';
import { Tool } from "langchain/tools";
import { Agent } from 'src/agent';
import { LULO_API_URI } from "src/shared/constants";
import { z } from "zod";

export const LuloGetPoolsAction: Action = {
  name: 'LULO_GET_POOLS',
  similes: [
    'get lulo pools',
    'fetch lulo pools',
  ],
  description: 'Fetch all pools on Lulo',
  examples: [
    [
      {
        input: {},
        output: {
          status: 'success',
          message: 'Pools fetched successfully',
          pools: {
            "regular": {
              "type": "regular",
              "apy": 0.05362,
              "maxWithdrawalAmount": 6522716.075627998,
              "price": 1.0265194276154868
            },
            "protected": {
              "type": "protected",
              "apy": 0.03391,
              "openCapacity": 10969601.169450996,
              "price": 1.013087634928608
            },
            "averagePoolRate": 0.044989999999999995,
            "totalLiquidity": 18184662.880863,
            "availableLiquidity": 18092032.575819,
            "regularLiquidityAmount": 10471727.472168999,
            "protectedLiquidityAmount": 7712877.666794,
            "regularAvailableAmount": 10379154.909024999
          },
        },
        explanation: 'Fetch all pools on Lulo',
      },
    ],
  ],
  schema: z.object({}),
  handler: async (agent: Agent) => {
    try {
      const result = await lulo_get_pools(agent);
      return {
        status: 'success',
        message: 'Pools fetched successfully',
        pools: result,
      };
    } catch (error: any) {
      return {
        status: 'error',
        message: `Fetching Lulo account failed: ${error.message}`,
      };
    }
  },
};

export class LuloGetPoolsTool extends Tool {
  name = 'LULO_GET_POOLS';
  description = `
    List all pools on Lulo
  `;

  constructor(private agent: Agent) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      const pools = await this.agent.luloGetPools();

      return JSON.stringify({
        status: 'success',
        message: 'Pools fetched successfully',
        pools: pools,
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

export async function lulo_get_pools(
  agent: Agent,
): Promise<LuloPoolData> {
  try {
    const client = axios.create({
      baseURL: LULO_API_URI,
    });

    const response = await client.get(`/v1/pool.getPools`,
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
    throw new Error(`Failed to get pools: ${error.message}`);
  }
}

type LuloPoolData = {
  regular: {
    type: string;
    apy: number;
    maxWithdrawalAmount: number;
    price: number;
  };
  protected: {
    type: string;
    apy: number;
    openCapacity: number;
    price: number;
  };
  averagePoolRate: number;
  totalLiquidity: number;
  availableLiquidity: number;
  regularLiquidityAmount: number;
  protectedLiquidityAmount: number;
  regularAvailableAmount: number;
};

// {
//   "regular": {
//     "type": "regular",
//     "apy": 0.05362,
//     "maxWithdrawalAmount": 6522716.075627998,
//     "price": 1.0265194276154868
//   },
//   "protected": {
//     "type": "protected",
//     "apy": 0.03391,
//     "openCapacity": 10969601.169450996,
//     "price": 1.013087634928608
//   },
//   "averagePoolRate": 0.044989999999999995,
//   "totalLiquidity": 18184662.880863,
//   "availableLiquidity": 18092032.575819,
//   "regularLiquidityAmount": 10471727.472168999,
//   "protectedLiquidityAmount": 7712877.666794,
//   "regularAvailableAmount": 10379154.909024999
// }