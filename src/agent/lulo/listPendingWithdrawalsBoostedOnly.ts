
import axios from "axios";
import { Action } from 'src/shared/types/actions';
import { Tool } from "langchain/tools";
import { Agent } from 'src/agent';
import { LULO_API_URI } from "src/shared/constants";
import { z } from "zod";

export const LuloListPendingWithdrawalsBoostedOnlyAction: Action = {
  name: 'LULO_LIST_PENDING_WITHDRAWALS_BOOSTED_ONLY',
  similes: [
    'get lulo pending withdrawals',
    'fetch lulo pending withdrawals',
  ],
  description: 'List a user pending withdrawals',
  examples: [
    [
      {
        input: {},
        output: {
          status: 'success',
          message: 'pending withdrawals listed successfully',
          pendingWithdrawals: [
            {
              id: 1,
              mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
              amount: 100,
              status: 'pending',
            },
          ],
        },
        explanation: 'List a user pending withdrawals',
      },
    ],
  ],
  schema: z.object({}),
  handler: async (agent: Agent) => {
    try {
      const result = await lulo_list_pending_withdrawals_boosted_only(agent);
      return {
        status: 'success',
        message: 'Pending withdrawals listed successfully',
        pendingWithdrawals: result.pendingWithdrawals,
      };
    } catch (error: any) {
      return {
        status: 'error',
        message: `Listing pending withdrawals failed: ${error.message}`,
      };
    }
  },
};

export class LuloListPendingWithdrawalsBoostedOnlyTool extends Tool {
  name = 'LULO_LIST_PENDING_WITHDRAWALS_BOOSTED_ONLY';
  description = `
    List a user pending withdrawals
  `;

  constructor(private agent: Agent) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      const pendingWithdrawals = await this.agent.luloListPendingWithdrawalsBoostedOnly();

      return JSON.stringify({
        status: 'success',
        message: 'Pending withdrawals listed successfully',
        pendingWithdrawals: pendingWithdrawals,
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

export async function lulo_list_pending_withdrawals_boosted_only(
  agent: Agent,
): Promise<LuloPendingWithdrawalsDataResponse> {
  try {
    const client = axios.create({
      baseURL: LULO_API_URI,
    });

    const response = await client.get(`/v1/account.withdrawals.listPendingWithdrawals?owner=${agent.account.publicKey.toBase58()}`,
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
    throw new Error(`Failed to list pending withdrawals: ${error.message}`);
  }
}

type LuloPendingWithdrawalData = {
  withdrawalId: number;
  owner: string;
  mintAddress: string;
  nativeAmount: number;
  status: string;
  createdTimestamp: number;
  cooldownSeconds: number;
};

type LuloPendingWithdrawalsDataResponse = {
  pendingWithdrawals: LuloPendingWithdrawalData[];
};

// {
//   "pendingWithdrawals": [
//     {
//       "owner": "9vL5L3AgznV3Uz474mEhT3oH95C3ApFWgSAHyiBh5fE8",
//       "withdrawalId": 17,
//       "nativeAmount": "2500001",
//       "createdTimestamp": 1742911049,
//       "cooldownSeconds": "86400",
//       "mintAddress": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
//     }
//   ]
// }
