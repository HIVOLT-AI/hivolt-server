import {
  CLMM_PROGRAM_ID,
  Raydium,
  TxVersion,

  CREATE_CPMM_POOL_FEE_ACC,
  CREATE_CPMM_POOL_PROGRAM,
} from "@raydium-io/raydium-sdk-v2";
import { MintLayout } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import Decimal from "decimal.js";
import { Action } from 'src/shared/types/actions';
import { z } from 'zod';
import { Tool } from 'langchain/tools';
import { Agent } from 'src/agent';

export const RaydiumCreateCpmmAction: Action = {
  name: 'RAYDIUM_CREATE_CPMM',
  similes: [
    'create cpmm pool',
    'create cpmm',
  ],
  description:
    'Create a CPMM pool',
  examples: [
    [
      {
        input: {
          mintA: 'So11111111111111111111111111111111111111112',
          mintB: 'So11111111111111111111111111111111111111112',
          configId: '6J2X5j8iGUE9rPpy8h52u9dfy85vPMU8aF4D2KYfrc4h',
          mintAAmount: '1000000000',
          mintBAmount: '1000000000',
          startTime: '1000000000',
        },
        output: {
          status: 'success',
          message: 'CPMM pool created successfully',
          txId: '2jg87stmvPygRXJrqfpydZQSzGJK9rKvawekzy5mzuEmSjRf8bCmiGpFH8iLa2YrQxtreWcK99319DVTpCJHYZfx',
        },
        explanation: 'Create a CPMM pool with specified token parameters',
      },
    ],
  ],
  schema: z.object({
    mintA: z.string(),
    mintB: z.string(),
    configId: z.string(),
    mintAAmount: z.string(),
    mintBAmount: z.string(),
    startTime: z.string(),
  }),
  handler: async (agent: Agent, input: Record<string, any>) => {
    try {
      const result = await raydium_create_cpmm(
        agent,
        input.mintA,
        input.mintB,
        input.configId,
        input.mintAAmount,
        input.mintBAmount,
        input.startTime,
      );

      return {
        status: 'success',
        message: 'CPMM pool created successfully',
        txId: result.txId,
      };
    } catch (error: any) {
      return {
        status: 'error',
        message: `Failed to create CPMM pool: ${error.message}`,
      };
    }
  },
};

export class RaydiumCreateCpmmTool extends Tool {
  name = 'RAYDIUM_CREATE_CPMM';
  description = `Create a CPMM pool.
    
    Inputs (input is a JSON string):
    mintA: string, eg "So11111111111111111111111111111111111111112" (required)
    mintB: string, eg "So11111111111111111111111111111111111111112" (required)
    configId: string, eg "6J2X5j8iGUE9rPpy8h52u9dfy85vPMU8aF4D2KYfrc4h" (required)
    mintAAmount: string, eg "1000000000" (required)
    mintBAmount: string, eg "1000000000" (required)
    startTime: string, eg "1000000000" (required)
    `;

  constructor(private agent: Agent) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      const result = await this.agent.raydiumCreateCpmm(
        parsedInput.mintA,
        parsedInput.mintB,
        parsedInput.configId,
        parsedInput.mintAAmount,
        parsedInput.mintBAmount,
        parsedInput.startTime,
      );

      return JSON.stringify({
        status: 'success',
        message: 'CPMM pool created successfully',
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

export async function raydium_create_cpmm(
  agent: Agent,
  mintA: PublicKey,
  mintB: PublicKey,
  configId: PublicKey,
  mintAAmount: BN,
  mintBAmount: BN,
  startTime: BN,
): Promise<{ txId: string }> {
  try {
    const raydium = await Raydium.load({
      owner: agent.account.publicKey,
      connection: agent.connection,
    });

    const [mintInfoA, mintInfoB] = await agent.connection.getMultipleAccountsInfo(
      [mintA, mintB],
    );
    if (mintInfoA === null || mintInfoB === null) {
      throw Error("fetch mint info error");
    }

    const mintDecodeInfoA = MintLayout.decode(mintInfoA.data);
    const mintDecodeInfoB = MintLayout.decode(mintInfoB.data);

    const mintFormatInfoA = {
      chainId: 101,
      address: mintA.toString(),
      programId: mintInfoA.owner.toString(),
      logoURI: "",
      symbol: "",
      name: "",
      decimals: mintDecodeInfoA.decimals,
      tags: [],
      extensions: {},
    };
    const mintFormatInfoB = {
      chainId: 101,
      address: mintB.toString(),
      programId: mintInfoB.owner.toString(),
      logoURI: "",
      symbol: "",
      name: "",
      decimals: mintDecodeInfoB.decimals,
      tags: [],
      extensions: {},
    };


    const response = await raydium.cpmm.createPool({
      programId: CREATE_CPMM_POOL_PROGRAM,
      poolFeeAccount: CREATE_CPMM_POOL_FEE_ACC,
      mintA: mintFormatInfoA,
      mintB: mintFormatInfoB,
      mintAAmount,
      mintBAmount,
      startTime,
      //@ts-expect-error sdk bug
      feeConfig: { id: configId.toString() },
      associatedOnly: false,
      ownerInfo: {
        useSOLBalance: true,
      },
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
    throw new Error(`Failed to create CPMM pool: ${error.message}`);
  }
}
