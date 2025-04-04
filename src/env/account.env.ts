import { registerAs } from '@nestjs/config';
import { ENV } from 'src/config/env.config';

export default registerAs('ACCOUNT', async () => {
  return {
    SOLANA_ACCOUNT_PRIVATE_KEY: ENV.SOLANA_ACCOUNT_PRIVATE_KEY,
    EVM_ACCOUNT_PRIVATE_KEY: ENV.EVM_ACCOUNT_PRIVATE_KEY,
  };
});
