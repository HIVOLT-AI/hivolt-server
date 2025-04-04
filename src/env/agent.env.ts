import { registerAs } from '@nestjs/config';
import { ENV } from 'src/config/env.config';

export default registerAs('AGENT', async () => {
  return {
    OPENAI_API_KEY: ENV.OPENAI_API_KEY,
    ANTHROPIC_API_KEY: ENV.ANTHROPIC_API_KEY,
    LULO_API_KEY: ENV.LULO_API_KEY,
  };
});
