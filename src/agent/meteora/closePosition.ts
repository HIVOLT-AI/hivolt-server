import { Action } from 'src/shared/types/actions';
import { Tool } from "langchain/tools";
import { Agent } from 'src/agent';
import { z } from "zod";
import { Keypair, PublicKey, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import DLMM from "@meteora-ag/dlmm";

export const MeteoraClosePositionAction: Action = {
  name: 'METEORA_CLOSE_POSITION',
  similes: [
    'close dlmm position',
    'close dlmm position for pool',
  ],
  description: 'Close a DLMM position',
  examples: [
    [
      {
        input: {
          poolAddress: 'pool Address',
          positionAddress: 'position Address',
        },
        output: {
          status: 'success',
          message: 'DLMM position closed successfully',
          txId: 'txId',
        },
        explanation: 'Close a DLMM position',
      },
    ],
  ],
  schema: z.object({}),
  handler: async (agent: Agent, input: Record<string, any>) => {
    try {
      const result = await meteora_close_position(agent,
        input.poolAddress,
        input.positionAddress,
      );
      return {

      };
    } catch (error: any) {
      return {
        status: 'error',
        message: `Closing DLMM position failed: ${error.message}`,
      };
    }
  },
};

export class MeteoraClosePositionTool extends Tool {
  name = 'METEORA_CLOSE_POSITION';
  description = `
    Close a DLMM position
    Input:
      poolAddress: string
      positionAddress: string
  `;

  constructor(private agent: Agent) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      const txId = await this.agent.meteoraClosePosition(
        parsedInput.poolAddress,
        parsedInput.positionAddress,
      );

      return JSON.stringify({
        status: 'success',
        message: 'DLMM position closed successfully',
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

export async function meteora_close_position(
  agent: Agent,
  poolAddress: string,
  positionAddress: string,
): Promise<{ txId: string }> {
  try {
    const pool = new PublicKey(poolAddress);
    const dlmmPool = await DLMM.create(agent.connection, pool);

    const position = await dlmmPool.getPosition(new PublicKey(positionAddress));
    const closePositionTx = await dlmmPool.closePosition({
      owner: agent.account.publicKey,
      position: position,
    });

    const instructions = closePositionTx.instructions;
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
    throw new Error(`Failed to close DLMM position: ${error.message}`);
  }
}

// https://github.com/MeteoraAg/dlmm-sdk/tree/main/ts-client
