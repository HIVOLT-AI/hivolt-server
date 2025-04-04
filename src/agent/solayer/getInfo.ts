import axios from "axios";
import { Action } from 'src/shared/types/actions';
import { Tool } from "langchain/tools";
import { Agent } from 'src/agent';
import { SOLAYER_API_URI } from "src/shared/constants";
import { z } from "zod";

export const SolayerGetInfoAction: Action = {
  name: 'SOLAYER_GET_INFO',
  similes: [
    'get solayer info',
    'fetch solayer info',
  ],
  description: 'Fetch the current info of the Solayer protocol',
  examples: [
    [
      {
        input: {},
        output: {
          status: 'success',
          message: 'fetched solayer info successfully',
          info: {
            "apy": 9.37,
            "depositors": 0,
            "epoch": 765,
            "epoch_diff_time": "2h31m26s",
            "epoch_end_time": 1743638694962,
            "epoch_start_time": 1743465894962,
            "ssol_holders": 0,
            "ssol_to_sol": 1.06987092,
            "susd_apy": 3.97,
            "susd_holders": 0,
            "token_tvl_usd": {
              "sBBSOL": "948916.4019",
              "sBNSOL": "615181.585588",
              "sBSOL": "526913.47010115",
              "sHSOL": "211859.905527",
              "sHUBSOL": "217670.89431517",
              "sINF": "4016902.852919",
              "sJITOSOL": "2787392.44150452",
              "sJSOL": "81796.43686023",
              "sJupSOL": "620468.40465498",
              "sLST": "28677.2839236",
              "sMSOL": "1585760.06616",
              "sSOL": "83335573.97186255",
              "sUSD": "11582529.526",
              "sVSOL": "1387.35014698"
            },
            "tvl_sol": "1020986.92420929",
            "tvl_usd": "127664205.00313014"
          },
        },
        explanation: 'Fetch the current info of the Solayer protocol',
      },
    ],
  ],
  schema: z.object({}),
  handler: async (agent: Agent) => {
    try {
      const result = await solayer_get_info(agent);
      return {

      };
    } catch (error: any) {
      return {
        status: 'error',
        message: `Fetching Solayer info failed: ${error.message}`,
      };
    }
  },
};

export class SolayerGetInfoTool extends Tool {
  name = 'SOLAYER_GET_INFO';
  description = `
    Fetch the current info of the Solayer protocol
  `;

  constructor(private agent: Agent) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      const info = await this.agent.solayerGetInfo();

      return JSON.stringify({
        status: 'success',
        message: 'Info fetched successfully',
        info: info,
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

export async function solayer_get_info(
  agent: Agent,
): Promise<SolayerInfoResponse> {
  try {
    const client = axios.create({
      baseURL: SOLAYER_API_URI,
    });

    const response = await client.get(`/api/info`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    const result = response.data
    return result;
  } catch (error: any) {
    throw new Error(`Failed to get info: ${error.message}`);
  }
}

type SolayerInfoResponse = {
  apy: number;
  depositors: number;
  epoch: number;
  epoch_diff_time: string;
  epoch_end_time: number;
  epoch_start_time: number;
  ssol_holders: number;
  ssol_to_sol: number;
  susd_apy: number;
  susd_holders: number;
  token_tvl_usd: Record<string, string>;
  tvl_sol: string;
  tvl_usd: string;
};

// {
//   "apy": 9.37,
//   "depositors": 0,
//   "epoch": 765,
//   "epoch_diff_time": "2h31m26s",
//   "epoch_end_time": 1743638694962,
//   "epoch_start_time": 1743465894962,
//   "ssol_holders": 0,
//   "ssol_to_sol": 1.06987092,
//   "susd_apy": 3.97,
//   "susd_holders": 0,
//   "token_tvl_usd": {
//     "sBBSOL": "948916.4019",
//     "sBNSOL": "615181.585588",
//     "sBSOL": "526913.47010115",
//     "sHSOL": "211859.905527",
//     "sHUBSOL": "217670.89431517",
//     "sINF": "4016902.852919",
//     "sJITOSOL": "2787392.44150452",
//     "sJSOL": "81796.43686023",
//     "sJupSOL": "620468.40465498",
//     "sLST": "28677.2839236",
//     "sMSOL": "1585760.06616",
//     "sSOL": "83335573.97186255",
//     "sUSD": "11582529.526",
//     "sVSOL": "1387.35014698"
//   },
//   "tvl_sol": "1020986.92420929",
//   "tvl_usd": "127664205.00313014"
// }
