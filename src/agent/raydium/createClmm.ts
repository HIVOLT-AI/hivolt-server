import {
  CLMM_PROGRAM_ID,
  Raydium,
  TxVersion,
} from "@raydium-io/raydium-sdk-v2";
import { MintLayout } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import Decimal from "decimal.js";
import { Action } from 'src/shared/types/actions';
import { z } from 'zod';
import { Tool } from 'langchain/tools';
import { Agent } from 'src/agent';

export const RaydiumCreateClmmAction: Action = {
  name: 'RAYDIUM_CREATE_CLMM',
  similes: [
    'create clmm pool',
    'create clmm',
  ],
  description:
    'Create a CLMM pool',
  examples: [
    [
      {
        input: {
          mint1: 'So11111111111111111111111111111111111111112',
          mint2: 'So11111111111111111111111111111111111111112',
          configId: '6J2X5j8iGUE9rPpy8h52u9dfy85vPMU8aF4D2KYfrc4h',
          initialPrice: '1000000000',
          startTime: '1000000000',
        },
        output: {
          status: 'success',
          message: 'CLMM pool created successfully',
          txId: '2jg87stmvPygRXJrqfpydZQSzGJK9rKvawekzy5mzuEmSjRf8bCmiGpFH8iLa2YrQxtreWcK99319DVTpCJHYZfx',
        },
        explanation: 'Create a CLMM pool with specified token parameters',
      },
    ],
  ],
  schema: z.object({
    mint1: z.string(),
    mint2: z.string(),
    configId: z.string(),
    initialPrice: z.string(),
    startTime: z.string(),
  }),
  handler: async (agent: Agent, input: Record<string, any>) => {
    try {
      const result = await raydium_create_clmm(
        agent,
        input.mint1,
        input.mint2,
        input.configId,
        input.initialPrice,
        input.startTime,
      );

      return {
        status: 'success',
        message: 'CLMM pool created successfully',
        txId: result.txId,
      };
    } catch (error: any) {
      return {
        status: 'error',
        message: `Failed to create CLMM pool: ${error.message}`,
      };
    }
  },
};

export class RaydiumCreateClmmTool extends Tool {
  name = 'RAYDIUM_CREATE_CLMM';
  description = `Create a CLMM pool.
  
  Inputs (input is a JSON string):
  mint1: string, eg "So11111111111111111111111111111111111111112" (required)
  mint2: string, eg "So11111111111111111111111111111111111111112" (required)
  configId: string, eg "6J2X5j8iGUE9rPpy8h52u9dfy85vPMU8aF4D2KYfrc4h" (required)
  initialPrice: string, eg "1000000000" (required)
  startTime: string, eg "1000000000" (required)
  `;

  constructor(private agent: Agent) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      const result = await this.agent.raydiumCreateClmm(
        parsedInput.mint1,
        parsedInput.mint2,
        parsedInput.configId,
        parsedInput.initialPrice,
        parsedInput.startTime,
      );

      return JSON.stringify({
        status: 'success',
        message: 'CLMM pool created successfully',
        txId: result.txId,
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

export async function raydium_create_clmm(
  agent: Agent,
  mint1: PublicKey,
  mint2: PublicKey,
  configId: PublicKey, // V4 CLMM Config ID: 6J2X5j8iGUE9rPpy8h52u9dfy85vPMU8aF4D2KYfrc4h
  initialPrice: Decimal,
  startTime: BN,
): Promise<{ txId: string }> {
  try {
    const raydium = await Raydium.load({
      owner: agent.account.publicKey,
      connection: agent.connection,
    });

    const [mintInfo1, mintInfo2] = await agent.connection.getMultipleAccountsInfo(
      [mint1, mint2],
    );
    if (mintInfo1 === null || mintInfo2 === null) {
      throw Error("fetch mint info error");
    }
    const mintDecodeInfo1 = MintLayout.decode(mintInfo1.data);
    const mintDecodeInfo2 = MintLayout.decode(mintInfo2.data);

    const mintFormatInfo1 = {
      chainId: 101,
      address: mint1.toString(),
      programId: mintInfo1.owner.toString(),
      logoURI: "",
      symbol: "",
      name: "",
      decimals: mintDecodeInfo1.decimals,
      tags: [],
      extensions: {},
    };
    const mintFormatInfo2 = {
      chainId: 101,
      address: mint2.toString(),
      programId: mintInfo2.owner.toString(),
      logoURI: "",
      symbol: "",
      name: "",
      decimals: mintDecodeInfo2.decimals,
      tags: [],
      extensions: {},
    };

    const response = await raydium.clmm.createPool({
      programId: CLMM_PROGRAM_ID,
      // programId: DEVNET_PROGRAM_ID.CLMM,
      mint1: mintFormatInfo1,
      mint2: mintFormatInfo2,
      // @ts-expect-error sdk bug
      ammConfig: { id: configId },
      initialPrice,
      startTime,
      txVersion: TxVersion.V0,
      // computeBudgetConfig: {
      //   units: 600000,
      //   microLamports: 46591500,
      // },
    });

    response.transaction.sign([agent.account]);

    const txId = await agent.connection.sendTransaction(response.transaction, {
      maxRetries: 3,
    });

    return { txId };
  } catch (error: any) {
    console.error(error);
    throw new Error(`Failed to create CLMM pool: ${error.message}`);
  }
}
