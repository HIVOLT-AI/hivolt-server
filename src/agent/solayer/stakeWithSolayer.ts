import axios from "axios";
import { Action } from 'src/shared/types/actions';
import { Tool } from "langchain/tools";
import { Agent } from 'src/agent';
import { SOLAYER_API_URI } from "src/shared/constants";
import { z } from "zod";
import { TransactionInstruction, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import { s } from "@raydium-io/raydium-sdk-v2/lib/api-790b1baf";

export const SolayerStakeSolAction: Action = {
  name: 'SOLANARAY_STAKE_SOL',
  similes: [
    'stake sol with solayer',
  ],
  description: `Stake SOL with Solayer`,
  examples: [
    [
      {
        input: {
            amount: 0.1,
        },
        output: {
          status: 'success',
          message: 'SOL staked successfully',
          txId: "2jg87stmvPygRXJrqfpydZQSzGJK9rKvawekzy5mzuEmSjRf8bCmiGpFH8iLa2YrQxtreWcK99319DVTpCJHYZfx",
        },
        explanation: 'Stake SOL with Solayer',
      },
    ],
  ],
  schema: z.object({
    amount: z.number(),
  }), 
  handler: async (agent: Agent, input: Record<string, any>) => {
    try {
      const result = await solayer_stake_sol(agent, input.amount);
      return {
        status: 'success',
        message: 'SOL staked successfully',
        txId: result.txId,
      };
    } catch (error: any) {
      return {
        status: 'error',
        message: `Stake SOL with Solayer failed: ${error.message}`,
      };
    }
  },
};

export class SolayerStakeSolTool extends Tool {
  name = 'SOLANARAY_STAKE_SOL';
  description = `Stake SOL with Solayer.
    
  Inputs (input is a JSON string):
  amount: number, eg 0.1 (required)
  `;

  constructor(private agent: Agent) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      const result = await this.agent.solayerStakeSol(parsedInput.amount);

      return JSON.stringify({
        status: 'success',
        message: 'SOL staked successfully',
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

export async function solayer_stake_sol(
  agent: Agent,
  amount: number,
): Promise<{ txId: string }> {
  try {
    const client = axios.create({
      baseURL: SOLAYER_API_URI,
    });

    const response = await client.post(`/api/action/restake/ssol?amount=${amount}`,
      {
        account: agent.account.publicKey.toBase58(),
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    const txBuffer = Buffer.from(response.data.tx, 'base64');
    const { blockhash } = await agent.connection.getLatestBlockhash();

    const tx = VersionedTransaction.deserialize(txBuffer);

    const messages = tx.message;

    const instructions = messages.compiledInstructions.map((ix) => {
      return new TransactionInstruction({
        programId: messages.staticAccountKeys[ix.programIdIndex],
        keys: ix.accountKeyIndexes.map((i) => ({
          pubkey: messages.staticAccountKeys[i],
          isSigner: messages.isAccountSigner(i),
          isWritable: messages.isAccountWritable(i),
        })),
        data: Buffer.from(ix.data as any, 'base64'),
      });
    });

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
    throw new Error(`Failed to stake SOL with Solayer: ${error.message}`);
  }
} 
