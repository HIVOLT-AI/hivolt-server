import { ENV } from 'src/config/env.config';

export const DEFAULT_RPC_URL = 'https://api.mainnet-beta.solana.com';

export const RPC_URL: Record<string, string> = {
  DEFAULT: 'https://api.mainnet-beta.solana.com',
  HELIUS: `https://mainnet.helius-rpc.com/?api-key=${ENV.HELIUS_API_KEY}`,
};

export const SANCTUM_STAT_API_URI = 'https://extra-api.sanctum.so';

export const SANCTUM_TRADE_API_URI = 'https://sanctum-s-api.fly.dev';

export const LULO_API_URI = 'https://api.lulo.fi';

export const SOLAYER_API_URI = 'https://app.solayer.org';

export const ANTHROPIC_MODEL = 'claude-3-5-sonnet-20241022';

export const METEORA_DLMM_API_URI = 'https://dlmm-api.meteora.ag';

export const ORCA_FEE_TIER = {
  1: 1,
  2: 2,
  4: 4,
  5: 8,
  16: 16,
  30: 64,
  65: 96,
  100: 128,
  200: 256,
} as const;
