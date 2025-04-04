import axios from "axios";
import { Action } from 'src/shared/types/actions';
import { Tool } from "langchain/tools";
import { Agent } from 'src/agent';
import { LULO_API_URI } from "src/shared/constants";
import { z } from "zod";

export const LuloGetAccountAction: Action = {
  name: 'LULO_GET_ACCOUNT',
  similes: [
    'get lulo account',
    'fetch lulo account',
  ],
  description: 'Fetch a user account on Lulo',
  examples: [
    [
      {
        input: {},
        output: {
          status: 'success',
          message: 'fetched a user account successfully',
          account: {
            "totalUsdValue": 0,
            "lusdUsdBalance": 0,
            "pusdUsdBalance": 0,
            "maxWithdrawable": {
              "protected": {
                "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v": 0
              },
              "regular": {
                "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v": 0
              }
            },
            "totalInterestEarned": 0,
            "protectedInterestEarned": 0,
            "regularInterestEarned": 0,
            "blockTime": 1743475802
          },
        },
        explanation: 'Fetch a user account on Lulo',
      },
    ],
  ],
  schema: z.object({}),
  handler: async (agent: Agent) => {
    try {
      const result = await lulo_get_account(agent);
      return {

      };
    } catch (error: any) {
      return {
        status: 'error',
        message: `Fetching Lulo account failed: ${error.message}`,
      };
    }
  },
};

export class LuloGetAccountTool extends Tool {
  name = 'LULO_GET_ACCOUNT';
  description = `
    List a user account information
  `;

  constructor(private agent: Agent) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      const account = await this.agent.luloGetAccount();

      return JSON.stringify({
        status: 'success',
        message: 'Account fetched successfully',
        account: account,
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

export async function lulo_get_account(
  agent: Agent,
): Promise<LuloAccountData> {
  try {
    const client = axios.create({
      baseURL: LULO_API_URI,
    });

    const response = await client.get(`/v1/account.getAccount?owner=${agent.account.publicKey.toBase58()}`,
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
    throw new Error(`Failed to get account: ${error.message}`);
  }
}

type LuloAccountData = {
  totalUsdValue: number;
  lusdUsdBalance: number;
  pusdUsdBalance: number;
  maxWithdrawable: {
    protected: Record<string, number>;
    regular: Record<string, number>;
  };
  totalInterestEarned: number;
  protectedInterestEarned: number;
  regularInterestEarned: number;
  blockTime: number;
};

// LuloAccountData
//
// {
//   "totalUsdValue": 0,
//     "lusdUsdBalance": 0,
//       "pusdUsdBalance": 0,
//         "maxWithdrawable": {
//     "protected": {
//       "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v": 0
//     },
//     "regular": {
//       "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v": 0
//     }
//   },
//   "totalInterestEarned": 0,
//   "protectedInterestEarned": 0,
//   "regularInterestEarned": 0,
//   "blockTime": 1743475802
// }
