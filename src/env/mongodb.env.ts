import { registerAs } from '@nestjs/config';
import { ENV } from 'src/config/env.config';

export default registerAs('MONGODB', async () => {
  return {
    URI: ENV.MONGODB_URL,
    USER: ENV.MONGODB_USERNAME,
    PASS: ENV.MONGODB_PASSWORD,
  };
});
