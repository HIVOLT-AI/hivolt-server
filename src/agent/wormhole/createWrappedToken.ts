import { Tool } from 'langchain/tools';
import { createWrappedToken } from 'src/shared/handler/wormhole';
import { Action } from 'src/shared/types/actions';
import { Chain } from '@wormhole-foundation/sdk';
import { NetworkType } from 'src/shared/types/chain';
import { CreateWrappedTokenResponse } from 'src/shared/types/wormhole';
import { z } from 'zod';
import { Agent } from 'src/agent';

export const WormholeCreateWrappedTokenAciton: Action = {
  name: 'WORMHOLE_CREATE_WRAPPED_TOKEN',
  description:
    'Create a wrapped token on a destination chain for a token from Solana as source chain using Wormhole',
  similes: [
    'create wrapped token on other chain',
    'wrap token on other chain',
    'generate wrapped token to other chain',
    'attest token to another chain',
  ],
  examples: [
    [
      {
        input: {
          destinationChain: 'BaseSepolia',
          tokenAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          network: 'Testnet',
        },
        output: {
          success: true,
          wrappedToken: {
            chain: 'BaseSepolia',
            address: '0x1234567890abcdef1234567890abcdef12345678',
          },
          attestationTxid:
            '5UYkBtRBMY92juhxH5ZbjitVsEaJwBXyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
        },
        explanation: 'Create a wrapped USDC token on BaseSepolia testnet',
      },
    ],
  ],
  schema: z.object({
    destinationChain: z
      .string()
      .describe('The destination chain to create the wrapped token on'),
    tokenAddress: z.string().describe('The address of the token to wrap'),
    network: z
      .string()
      .optional()
      .describe('The network to use for the wrapped token'),
  }),
  handler: async (agent: Agent, input: Record<string, any>) => {
    try {
      const result = await wormhole_create_wrapped_token(
        agent,
        input.destinationChain,
        input.tokenAddress,
        input.network,
      );

      return {
        status: 'success',
        message: 'Wrapped token created successfully',
        result,
      };
    } catch (error: any) {
      return {
        status: 'error',
        message: `Creating wrapped token failed: ${error.message}`,
      };
    }
  },
};

export class WormholeCreateWrappedTokenTool extends Tool {
  name = 'WORMHOLE_CREATE_WRAPPED_TOKEN';
  description = `Create a wrapped token on a destination chain for a token from Solana as source chain using Wormhole
  
  Inputs (input is a JSON string):
  destinationChain: string, eg "BaseSepolia" (required)
  tokenAddress: string, eg "7Uuzh9JwqF8z3u6MWpQuQJbpD1u46xPDY6PGjwfwTh4o" (required)
  network: string, eg "Devnet" (optional)
  `;

  constructor(private agent: Agent) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      const result = await this.agent.wormholeCreateWrappedToken(
        parsedInput.destinationChain,
        parsedInput.tokenAddress,
        parsedInput.network,
      );

      return JSON.stringify({
        status: 'success',
        message: 'Wrapped token created successfully',
        result,
      });
    } catch (error: any) {
      return JSON.stringify({
        status: 'error',
        message: `Creating wrapped token failed: ${error.message}`,
        code: error.code || 'UNKNOWN_ERROR',
      });
    }
  }
}

export const wormhole_create_wrapped_token = async (
  agent: Agent,
  destinationChain: Chain,
  tokenAddress: string,
  network: NetworkType,
): Promise<CreateWrappedTokenResponse> => {
  try {
    return createWrappedToken(agent, destinationChain, tokenAddress, network);
  } catch (error: any) {
    throw new Error(`Creating wrapped token failed: ${error.message}`);
  }
};
