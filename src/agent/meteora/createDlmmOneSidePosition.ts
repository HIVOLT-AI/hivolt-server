import { Action } from 'src/shared/types/actions';
import { Tool } from "langchain/tools";
import { Agent } from 'src/agent';
import { z } from "zod";
import { Keypair, PublicKey, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import DLMM, { autoFillYByStrategy, StrategyType } from "@meteora-ag/dlmm";
import { BN } from "bn.js";
import { getMint } from "@solana/spl-token";

export const MeteoraCreateDlmmOneSidePositionAction: Action = {
  name: 'METEORA_CREATE_DLMM_ONE_SIDE_POSITION',
  similes: [
    'create dlmm one side position',
    'create dlmm one side position for pool',
  ],
  description: 'Create a new DLMM one side position',
  examples: [
    [
      {
        input: {
          poolAddress: 'poolAddress',
          baseMintAddress: 'baseMintAddress',
          tokenXAmount: 100,
        },
        output: {
          status: 'success',
          message: 'DLMM one side position created successfully',
          txId: 'txId',
        },
        explanation: 'Create a new DLMM one side position',
      },
    ],
  ],
  schema: z.object({}),
  handler: async (agent: Agent, input: Record<string, any>) => {
    try {
      const result = await meteora_create_dlmm_one_side_position(agent,
        input.poolAddress,
        input.baseMintAddress,
        input.tokenXAmount,
      );
      return {

      };
    } catch (error: any) {
      return {
        status: 'error',
        message: `Creating DLMM one side position failed: ${error.message}`,
      };
    }
  },
};

export class MeteoraCreateDlmmOneSidePositionTool extends Tool {
  name = 'METEORA_CREATE_DLMM_ONE_SIDE_POSITION';
  description = `
    Create a new DLMM one side position
    Input:
      poolAddress: string
      baseMintAddress: PublicKey
      tokenXAmount: number
  `;

  constructor(private agent: Agent) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      const txId = await this.agent.meteoraCreateDlmmOneSidePosition(
        parsedInput.poolAddress,
        parsedInput.baseMintAddress,
        parsedInput.tokenXAmount,
      );

      return JSON.stringify({
        status: 'success',
        message: 'DLMM one side position created successfully',
        txId: txId,
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

export async function meteora_create_dlmm_one_side_position(
  agent: Agent,
  poolAddress: string,
  baseMintAddress: PublicKey,
  tokenXAmount: number,
): Promise<{ txId: string }> {
  try {
    const pool = new PublicKey(poolAddress);
    const dlmmPool = await DLMM.create(agent.connection, pool);

    // get active bin
    const activeBin = await dlmmPool.getActiveBin();

    // create balance position
    const TOTAL_RANGE_INTERVAL = 10; // 10 bins on each side of the active bin
    const minBinId = activeBin.binId;
    const maxBinId = activeBin.binId + TOTAL_RANGE_INTERVAL * 2;

    const baseMint = await getMint(agent.connection, baseMintAddress);
    const totalXAmount = new BN(tokenXAmount * 10 ** baseMint.decimals);
    const totalYAmount = new BN(0);

    const newOneSidePosition = new Keypair();

    // create position
    const createPositionTx =
      await dlmmPool.initializePositionAndAddLiquidityByStrategy({
        positionPubKey: newOneSidePosition.publicKey,
        user: agent.account.publicKey,
        totalXAmount,
        totalYAmount,
        strategy: {
          maxBinId,
          minBinId,
          strategyType: StrategyType.Spot, // can be StrategyType.Spot, StrategyType.BidAsk, StrategyType.Curve
        },
      });

    const instructions = createPositionTx.instructions;
    const { blockhash } = await agent.connection.getLatestBlockhash();

    const newMessage = new TransactionMessage({
      payerKey: agent.account.publicKey,
      recentBlockhash: blockhash,
      instructions,
    }).compileToV0Message();

    const newTx = new VersionedTransaction(newMessage);

    newTx.sign([agent.account]);
    const txId = await agent.connection.sendTransaction(newTx, {
      maxRetries: 3,
    });

    return { txId };
  } catch (error: any) {
    throw new Error(`Failed to create DLMM one side position: ${error.message}`);
  }
}

// https://github.com/MeteoraAg/dlmm-sdk/tree/main/ts-client
