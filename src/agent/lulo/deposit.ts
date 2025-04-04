import { TransactionInstruction, TransactionMessage, VersionedTransaction } from '@solana/web3.js';
import axios from 'axios';
import { Tool } from 'langchain/tools';
import { Agent } from 'src/agent';
import { LULO_API_URI } from 'src/shared/constants';
import { Action } from 'src/shared/types/actions';
import { z } from 'zod';

export const LuloDepositAction: Action = {
  name: 'LULO_DEPOSIT',
  similes: ['deposit USDC to lulo'],
  description: 'deposit USDC to lulo',
  examples: [
    [
      {
        input: {
          mintAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          protectedAmount: 150,
          regularAmount: 50,
        },
        output: {
          status: 'success',
          message: 'deposit added successfully',
          txId: '2jg87stmvPygRXJrqfpydZQSzGJK9rKvawekzy5mzuEmSjRf8bCmiGpFH8iLa2YrQxtreWcK99319DVTpCJHYZfx',
        },
        explanation: 'Deposit USDC to Lulo',
      },
    ]
  ],
  schema: z.object({
    mintAddress: z.string(),
    protectedAmount: z.number(),
    regularAmount: z.number(),
  }),
  handler: async (agent: Agent, input: Record<string, any>) => {
    try {
      const result = await lulo_deposit(agent, input.mintAddress, input.protectedAmount, input.regularAmount);

      return {
        status: 'success',
        message: 'deposit added successfully',
        txId: result.txId,
      };
    } catch (error: any) {
      return {
        status: 'error',
        message: `failed to deposit: ${error.message}`,
      };
    }
  },
};

export class LuloDepositTool extends Tool {
  name = 'LULO_DEPOSIT';
  description = `Deposit USDC to Lulo.
  
  Inputs (input is a JSON string):
  mintAddress: string, eg "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" (required)
  protectedAmount: number, eg 150 (optional)
  regularAmount: number, eg 50 (optional)
  `;

  constructor(private agent: Agent) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      const result = await this.agent.luloDeposit(
        parsedInput.mintAddress,
        parsedInput.protectedAmount,
        parsedInput.regularAmount,
      );

      return JSON.stringify({
        status: 'success',
        message: 'Deposit USDC to Lulo added successfully',
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

export async function lulo_deposit(
   agent: Agent,
   mintAddress: string,
   protectedAmount?: number,
   regularAmount?: number,
): Promise<{ txId: string }> {
  try {
    const client = axios.create({
      baseURL: LULO_API_URI,
    });
    const response = await client.post('/v1/generate.transactions.deposit?priorityFee=500000', {
      owner: agent.account.publicKey.toBase58(),
      mintAddress: mintAddress, // USDC: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
      protectedAmount: protectedAmount ?? 0,
      regularAmount: regularAmount ?? 0,
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': agent.config?.LULO_API_KEY ?? '',
      },
    });

    const txBuffer = Buffer.from(response.data.trasnaction, 'base64');
    const tx = VersionedTransaction.deserialize(txBuffer);
    const { blockhash } = await agent.connection.getLatestBlockhash();

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
    throw new Error(`Failed to deposit USDC to Lulo: ${error.message}`);
  }
}
