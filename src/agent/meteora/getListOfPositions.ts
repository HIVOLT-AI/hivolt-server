import { Action } from 'src/shared/types/actions';
import { z } from 'zod';
import { Tool } from 'langchain/tools';
import { Agent } from 'src/agent';
import axios from 'axios';
import { METEORA_DLMM_API_URI } from 'src/shared/constants';
import { PublicKey } from '@solana/web3.js';
import DLMM, { PositionBinData } from '@meteora-ag/dlmm';

export const MeteoraGetListOfPositionsAction: Action = {
  name: 'METEORA_GET_LIST_OF_POSITIONS',
  similes: [
    'get list of positions',
    'get list of positions information',
    'get list of positions',
    'get list of positions details',
  ],
  description:
    'Get list of positions',
  examples: [
    [
      {
        input: {
          poolAddress: '5rCf1DM8LjKTw4YqhnoLcngyZYeNnQqztScTogYHAS6',
        },
        output: {
          status: 'success',
          message: 'List of positions retrieved successfully',
          positions: [
            {
              binId: 0,
              price: '0.000000000000000000',
              pricePerToken: '0.000000000000000000',
              binXAmount: '0.000000000000000000',
              binYAmount: '0.000000000000000000',
              binLiquidity: '0.000000000000000000',
              positionLiquidity: '0.000000000000000000',
              positionXAmount: '0.000000000000000000',
              positionYAmount: '0.000000000000000000',
              positionFeeXAmount: '0.000000000000000000',
              positionFeeYAmount: '0.000000000000000000',
              positionRewardAmount: ['0.000000000000000000'],
            },
          ],
        },
        explanation: 'Get list of positions',
      },
    ],
  ],
  schema: z.object({
    poolAddress: z.string(),
  }),
  handler: async (agent: Agent, input: Record<string, any>) => {
    try {
      const result = await meteora_get_list_of_positions(
        agent,
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

export class MeteoraGetListOfPositionsTool extends Tool {
  name = 'METEORA_GET_LIST_OF_POSITIONS';
  description = `Get list of positions.
  
  Inputs (input is a JSON string):
  poolAddress: string, eg "5rCf1DM8LjKTw4YqhnoLcngyZYeNnQqztScTogYHAS6" (required)
  `;

  constructor(private agent: Agent) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      const result = await this.agent.meteoraGetListOfPositions(
        parsedInput.poolAddress,
      );

      return JSON.stringify({
        status: 'success',
        message: 'List of positions retrieved successfully',
        positions: result,
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

export async function meteora_get_list_of_positions(
  agent: Agent,
  poolAddress: string,
): Promise<PositionBinData[]> {
  try {
    const pool = new PublicKey(poolAddress);
    const dlmmPool = await DLMM.create(agent.connection, pool);

    const { userPositions } = await dlmmPool.getPositionsByUserAndLbPair(
      agent.account.publicKey
    );
    const binData = userPositions[0].positionData.positionBinData;

    return binData;

  } catch (error: any) {
    console.error(error);
    throw new Error(`Failed to get list of positions: ${error.message}`);
  }
}
