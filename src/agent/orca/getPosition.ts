import { Agent } from 'src/agent';
import { Wallet } from '@coral-xyz/anchor';
import {
  WhirlpoolContext,
  ORCA_WHIRLPOOL_PROGRAM_ID,
  buildWhirlpoolClient,
  getAllPositionAccountsByOwner,
  PriceMath,
} from '@orca-so/whirlpools-sdk';
import { OrcaPositionDataMap } from 'src/shared/types/orca';
import { Action } from 'src/shared/types/actions';
import { z } from 'zod';
import { Tool } from 'langchain/tools';

export const OrcaGetPosition: Action = {
  name: 'ORCA_GET_POSITION',
  description:
    'Fetch all the liquidity positions in an Orca Whirlpool by owner. Returns an object with position mint addresses as keys and position status details as values.',
  similes: [
    'get orca liquidity positions',
    'get orca whirlpool positions',
    'get orca liquidity pools',
    'get my orca liquidity positions',
    'fetch orca liquidity positions',
    'fetch orca whirlpool positions',
    'fetch orca liquidity pools',
    'fetch my orca liquidity positions',
  ],
  examples: [
    [
      {
        input: {},
        output: {
          status: 'success',
          message: 'Fetched Orca positions successfully',
          positions: {
            positionMintAddress1: {
              whirlpoolAddress: 'whirlpoolAddress1',
              positionInRange: true,
              distanceFromCenterBps: 100,
            },
            positionMintAddress2: {
              whirlpoolAddress: 'whirlpoolAddress2',
              positionInRange: false,
              distanceFromCenterBps: 200,
            },
          },
        },
        explanation: 'Fetch all Orca positions for the owner',
      },
    ],
  ],
  schema: z.object({}),
  handler: async (agent: Agent) => {
    try {
      const positions = await orca_get_position(agent);

      return {
        status: 'success',
        message: 'Fetched Orca positions successfully',
        positions,
      };
    } catch (error: any) {
      return {
        status: 'error',
        message: `Fetching Orca positions failed: ${error.message}`,
      };
    }
  },
};

export class OrcaGetPositionTool extends Tool {
  name = 'ORCA_GET_POSITION';
  description =
    'Fetch all the liquidity positions in an Orca Whirlpool by owner. Returns an object with position mint addresses as keys and position status details as values.';

  constructor(private agent: Agent) {
    super();
  }

  protected async _call(): Promise<string> {
    try {
      const positions = await this.agent.orcaGetPosition();

      return JSON.stringify({
        status: 'success',
        message: 'Fetched Orca positions successfully',
        positions,
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

export async function orca_get_position(
  agent: Agent,
): Promise<OrcaPositionDataMap> {
  try {
    const wallet = new Wallet(agent.account);
    const ctx = WhirlpoolContext.from(
      agent.connection,
      wallet,
      ORCA_WHIRLPOOL_PROGRAM_ID,
    );

    const client = buildWhirlpoolClient(ctx);
    const positions = await getAllPositionAccountsByOwner({
      ctx,
      owner: agent.account.publicKey,
    });

    const positionDatas = [
      ...positions.positions.entries(),
      ...positions.positionsWithTokenExtensions.entries(),
    ];

    const result: OrcaPositionDataMap = {};

    for (const [, positionData] of positionDatas) {
      const positionMintAddress = positionData.positionMint;
      const whirlpoolAddress = positionData.whirlpool;
      const whirlpool = await client.getPool(whirlpoolAddress);
      const whirlpoolData = whirlpool.getData();
      const sqrtPrice = whirlpoolData.sqrtPrice;
      const currentTick = whirlpoolData.tickCurrentIndex;
      const mintA = whirlpool.getTokenAInfo();
      const mintB = whirlpool.getTokenBInfo();
      const currentPrice = PriceMath.sqrtPriceX64ToPrice(
        sqrtPrice,
        mintA.decimals,
        mintB.decimals,
      );
      const lowerTick = positionData.tickLowerIndex;
      const upperTick = positionData.tickUpperIndex;
      const lowerPrice = PriceMath.tickIndexToPrice(
        lowerTick,
        mintA.decimals,
        mintB.decimals,
      );
      const upperPrice = PriceMath.tickIndexToPrice(
        upperTick,
        mintA.decimals,
        mintB.decimals,
      );
      const centerPosition = lowerPrice.add(upperPrice).div(2);

      const positionInRange =
        currentTick > lowerTick && currentTick < upperTick ? true : false;
      const distanceFromCenterBps = Math.ceil(
        currentPrice
          .sub(centerPosition)
          .abs()
          .div(centerPosition)
          .mul(10000)
          .toNumber(),
      );

      result[positionMintAddress.toString()] = {
        whirlpoolAddress: whirlpoolAddress.toString(),
        positionInRange,
        distanceFromCenterBps,
      };
    }

    return result;
  } catch (error: any) {
    throw new Error(`Fetching Orca position failed: ${error.message}`);
  }
}
