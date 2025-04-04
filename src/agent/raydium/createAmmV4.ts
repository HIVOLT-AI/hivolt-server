import {
  CLMM_PROGRAM_ID,
  Raydium,
  TxVersion,
  AMM_V4,
  FEE_DESTINATION_ID,
  MARKET_STATE_LAYOUT_V3,
  OPEN_BOOK_PROGRAM,
} from "@raydium-io/raydium-sdk-v2";
import { MintLayout, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import Decimal from "decimal.js";
import { Action } from 'src/shared/types/actions';
import { z } from 'zod';
import { Tool } from 'langchain/tools';
import { Agent } from 'src/agent';

export const RaydiumCreateAmmV4Action: Action = {
  name: 'RAYDIUM_CREATE_AMM_V4',
  similes: [
    'create amm v4 pool',
    'create amm',
  ],
  description:
    'Create a AMM V4 pool',
  examples: [
    [
      {
        input: {
          marketId: 'So11111111111111111111111111111111111111112',
          baseAmount: '1000000000',
          quoteAmount: '1000000000',
          startTime: '1000000000',
        },
        output: {
          status: 'success',
          message: 'CLMM pool created successfully',
          txId: '2jg87stmvPygRXJrqfpydZQSzGJK9rKvawekzy5mzuEmSjRf8bCmiGpFH8iLa2YrQxtreWcK99319DVTpCJHYZfx',
        },
        explanation: 'Create a AMM V4 pool with specified token parameters',
      },
    ],
  ],
  schema: z.object({
    marketId: z.string(),
    baseAmount: z.string(),
    quoteAmount: z.string(),
    startTime: z.string(),
  }),
  handler: async (agent: Agent, input: Record<string, any>) => {
    try {
      const result = await raydium_create_amm_v4(
        agent,
        input.marketId,
        input.baseAmount,
        input.quoteAmount,
        input.startTime,
      );

      return {
        status: 'success',
        message: 'AMM V4 pool created successfully',
        txId: result.txId,
      };
    } catch (error: any) {
      return {
        status: 'error',
        message: `Failed to create AMM V4 pool: ${error.message}`,
      };
    }
  },
};

export class RaydiumCreateAmmV4Tool extends Tool {
  name = 'RAYDIUM_CREATE_AMM_V4';
  description = `Create a AMM V4 pool.
    
    Inputs (input is a JSON string):
    marketId: string, eg "So11111111111111111111111111111111111111112" (required)
    baseAmount: string, eg "1000000000" (required)
    quoteAmount: string, eg "1000000000" (required)
    startTime: string, eg "1000000000" (required)
    `;

  constructor(private agent: Agent) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      const result = await this.agent.raydiumCreateAmmV4(
        parsedInput.marketId,
        parsedInput.baseAmount,
        parsedInput.quoteAmount,
        parsedInput.startTime,
      );

      return JSON.stringify({
        status: 'success',
        message: 'AMM V4 pool created successfully',
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

export async function raydium_create_amm_v4(
  agent: Agent,
  marketId: PublicKey,
  baseAmount: BN,
  quoteAmount: BN,
  startTime: BN,
): Promise<{ txId: string }> {
  try {
    const raydium = await Raydium.load({
      owner: agent.account.publicKey,
      connection: agent.connection,
    });

    const marketBufferInfo = await agent.connection.getAccountInfo(
      new PublicKey(marketId),
    );
    const { baseMint, quoteMint } = MARKET_STATE_LAYOUT_V3.decode(
      marketBufferInfo!.data,
    );

    const baseMintInfo = await agent.connection.getAccountInfo(baseMint);
    const quoteMintInfo = await agent.connection.getAccountInfo(quoteMint);

    if (
      baseMintInfo?.owner.toString() !== TOKEN_PROGRAM_ID.toBase58() ||
      quoteMintInfo?.owner.toString() !== TOKEN_PROGRAM_ID.toBase58()
    ) {
      throw new Error(
        "amm pools with openbook market only support TOKEN_PROGRAM_ID mints, if you want to create pool with token-2022, please create cpmm pool instead",
      );
    }
    if (
      baseAmount
        .mul(quoteAmount)
        .lte(
          new BN(1)
            .mul(new BN(10 ** MintLayout.decode(baseMintInfo.data).decimals))
            .pow(new BN(2)),
        )
    ) {
      throw new Error(
        "initial liquidity too low, try adding more baseAmount/quoteAmount",
      );
    }

    const response = await raydium.liquidity.createPoolV4({
      programId: AMM_V4,
      marketInfo: {
        marketId,
        programId: OPEN_BOOK_PROGRAM,
      },
      baseMintInfo: {
        mint: baseMint,
        decimals: MintLayout.decode(baseMintInfo.data).decimals,
      },
      quoteMintInfo: {
        mint: quoteMint,
        decimals: MintLayout.decode(quoteMintInfo.data).decimals,
      },
      baseAmount,
      quoteAmount,

      startTime,
      ownerInfo: {
        useSOLBalance: true,
      },
      associatedOnly: false,
      txVersion: TxVersion.V0,
      feeDestinationId: FEE_DESTINATION_ID,
    });

    response.transaction.sign([agent.account]);

    const txId = await agent.connection.sendTransaction(response.transaction, {
      maxRetries: 3,
    });

    return { txId };
  } catch (error: any) {
    console.error(error);
    throw new Error(`Failed to create AMM V4 pool: ${error.message}`);
  }
}
