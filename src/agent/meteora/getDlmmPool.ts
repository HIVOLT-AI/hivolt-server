import { Action } from 'src/shared/types/actions';
import { z } from 'zod';
import { Tool } from 'langchain/tools';
import { Agent } from 'src/agent';
import axios from 'axios';
import { METEORA_DLMM_API_URI } from 'src/shared/constants';

export const MeteoraGetDlmmPoolAction: Action = {
  name: 'METEORA_GET_DLMM_POOL',
  similes: [
    'get dlmm pool info',
    'get dlmm pool information',
    'get dlmm pool',
    'get dlmm pool details',
  ],
  description:
    'Get DLMM pool information',
  examples: [
    [
      {
        input: {
          lstMint: 'So11111111111111111111111111111111111111112',
          poolAddress: '5rCf1DM8LjKTw4YqhnoLcngyZYeNnQqztScTogYHAS6',
        },
        output: {
          status: 'success',
          message: 'DLMM pool information retrieved successfully',
          poolInfo: {
            address: '5rCf1DM8LjKTw4YqhnoLcngyZYeNnQqztScTogYHAS6',
            name: 'SOL-USDC',
            mint_x: 'So11111111111111111111111111111111111111112',
            mint_y: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
            reserve_x: 'EYj9xKw6ZszwpyNibHY7JD5o3QgTVrSdcBp1fMJhrR9o',
            reserve_y: 'CoaxzEh8p5YyGLcj36Eo3cUThVJxeKCs7qvLAGDYwBcz',
            reserve_x_amount: 23419597481996,
            reserve_y_amount: 873286117842,
            bin_step: 4,
            base_fee_percentage: '0.04',
            max_fee_percentage: '0.2128', 
            protocol_fee_percentage: '5',
            liquidity: '3689212.0760550606',
            reward_mint_x: '11111111111111111111111111111111',
            reward_mint_y: '11111111111111111111111111111111',
            fees_24h: 57078.0262906779,
            today_fees: 8069.84584345482,
            trade_volume_24h: 110673622.848341,
            cumulative_trade_volume: 5632674185.3600,
            cumulative_fee_volume: 2724645.4200,
            current_price: 120.226675809934,
            apr: 1.54716034518982,
            apy: 27048.1924998641,
            farm_apr: 0,
            farm_apy: 0,
            hide: false,
            is_blacklisted: false,
            fees: {
              min_30: 415.328240258148,
              hour_1: 899.200138687031,
              hour_2: 3030.85935493164,
              hour_4: 8687.85811800924,
              hour_12: 38853.6576055993,
              hour_24: 57078.0262906779
            },
            fee_tvl_ratio: {
              min_30: 0.0112579117626186,
              hour_1: 0.0243737719640276,
              hour_2: 0.0821546523335843,
              hour_4: 0.235493594266321,
              hour_12: 1.05316953334779,
              hour_24: 1.54716034518982
            },
            volume: {
              min_30: 1078890.83430728,
              hour_1: 2307257.01971402,
              hour_2: 7204152.13987082,
              hour_4: 19451997.7554433,
              hour_12: 69037510.7763434,
              hour_24: 110673622.848341
            },
            tags: []
          },
        },
        explanation: 'Get DLMM pool information',
      },
    ],
  ],
  schema: z.object({
    poolAddress: z.string(),
  }),
  handler: async (agent: Agent, input: Record<string, any>) => {
    try {
      const result = await meteora_get_dlmm_pool(
        input.poolAddress,
      );

      return {
        status: 'success',
        message: 'DLMM pool information retrieved successfully',
        poolInfo: result,
      };
    } catch (error: any) {
      return {
        status: 'error',
        message: `Failed to get DLMM pool information: ${error.message}`,
      };
    }
  },
};

export class MeteoraGetDlmmPoolTool extends Tool {
  name = 'METEORA_GET_DLMM_POOL';
  description = `Get DLMM pool information.
  
  Inputs (input is a JSON string):
  poolAddress: string, eg "5rCf1DM8LjKTw4YqhnoLcngyZYeNnQqztScTogYHAS6" (required)
  `;

  constructor(private agent: Agent) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      const result = await this.agent.meteoraGetDlmmPool(
        parsedInput.poolAddress,
      );

      return JSON.stringify({
        status: 'success',
        message: 'DLMM pool information retrieved successfully',
        poolInfo: result,
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

export async function meteora_get_dlmm_pool(
  poolAddress: string,
): Promise<DlmmPoolInfo> {
  try {
    const client = axios.create({
      baseURL: METEORA_DLMM_API_URI,
    });

    const response = await client.get(`/pair/${poolAddress}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
    const result = response.data;
    return result;
  } catch (error: any) {
    console.error(error);
    throw new Error(`Failed to get DLMM pool: ${error.message}`);
  }
}

type DlmmPoolInfo = {
  address: string;
  name: string;
  mint_x: string;
  mint_y: string;
  reserve_x: string;
  reserve_y: string;
  reserve_x_amount: number;
  reserve_y_amount: number;
  bin_step: number;
  base_fee_percentage: string;
  max_fee_percentage: string;
  protocol_fee_percentage: string;
  liquidity: string;
  reward_mint_x: string;
  reward_mint_y: string;
  fees_24h: number;
  today_fees: number;
  trade_volume_24h: number;
  cumulative_trade_volume: number;
  cumulative_fee_volume: number;
  current_price: number;
  apr: number;
  apy: number;
  farm_apr: number;
  farm_apy: number;
  hide: boolean;
  is_blacklisted: boolean;
  fees: {
    min_30: number;
    hour_1: number;
    hour_2: number;
    hour_4: number;
    hour_12: number;
    hour_24: number;
  };
  fee_tvl_ratio: {
    min_30: number;
    hour_1: number;
    hour_2: number;
    hour_4: number;
    hour_12: number;
    hour_24: number;
  };
  volume: {
    min_30: number;
    hour_1: number;
    hour_2: number;
    hour_4: number;
    hour_12: number;
    hour_24: number;
  };
  tags: string[];
}

// {
//   "address": "5rCf1DM8LjKTw4YqhnoLcngyZYeNnQqztScTogYHAS6",
//   "name": "SOL-USDC",
//   "mint_x": "So11111111111111111111111111111111111111112",
//   "mint_y": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
//   "reserve_x": "EYj9xKw6ZszwpyNibHY7JD5o3QgTVrSdcBp1fMJhrR9o",
//   "reserve_y": "CoaxzEh8p5YyGLcj36Eo3cUThVJxeKCs7qvLAGDYwBcz",
//   "reserve_x_amount": 23419597481996,
//   "reserve_y_amount": 873286117842,
//   "bin_step": 4,
//   "base_fee_percentage": "0.04",
//   "max_fee_percentage": "0.2128",
//   "protocol_fee_percentage": "5",
//   "liquidity": "3689212.0760550606",
//   "reward_mint_x": "11111111111111111111111111111111",
//   "reward_mint_y": "11111111111111111111111111111111",
//   "fees_24h": 57078.0262906779,
//   "today_fees": 8069.84584345482,
//   "trade_volume_24h": 110673622.848341,
//   "cumulative_trade_volume": "5632674185.3600",
//   "cumulative_fee_volume": "2724645.4200",
//   "current_price": 120.226675809934,
//   "apr": 1.54716034518982,
//   "apy": 27048.1924998641,
//   "farm_apr": 0,
//   "farm_apy": 0,
//   "hide": false,
//   "is_blacklisted": false,
//   "fees": {
//     "min_30": 415.328240258148,
//     "hour_1": 899.200138687031,
//     "hour_2": 3030.85935493164,
//     "hour_4": 8687.85811800924,
//     "hour_12": 38853.6576055993,
//     "hour_24": 57078.0262906779
//   },
//   "fee_tvl_ratio": {
//     "min_30": 0.0112579117626186,
//     "hour_1": 0.0243737719640276,
//     "hour_2": 0.0821546523335843,
//     "hour_4": 0.235493594266321,
//     "hour_12": 1.05316953334779,
//     "hour_24": 1.54716034518982
//   },
//   "volume": {
//     "min_30": 1078890.83430728,
//     "hour_1": 2307257.01971402,
//     "hour_2": 7204152.13987082,
//     "hour_4": 19451997.7554433,
//     "hour_12": 69037510.7763434,
//     "hour_24": 110673622.848341
//   },
//   "tags": []
// }
