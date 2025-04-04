import * as Joi from 'joi';
import * as dotenv from 'dotenv';
import { cleanEnv, str } from 'envalid';

dotenv.config();

export const ENV_SHAPE = {
  MONGODB_URL: 'MONGODB_URL',
  MONGODB_PASSWORD: 'MONGODB_PASSWORD',
  MONGODB_USERNAME: 'MONGODB_USERNAME',
  SWAGGER_USER_ID: 'SWAGGER_USER_ID',
  SWAGGER_USER_PW: 'SWAGGER_USER_PW',
  OPENAI_API_KEY: 'OPENAI_API_KEY',
  ANTHROPIC_API_KEY: 'ANTHROPIC_API_KEY',
  HELIUS_API_KEY: 'HELIUS_API_KEY',
  SOLANA_ACCOUNT_PRIVATE_KEY: 'SOLANA_ACCOUNT_PRIVATE_KEY',
  EVM_ACCOUNT_PRIVATE_KEY: 'EVM_ACCOUNT_PRIVATE_KEY',
  LULO_API_KEY: 'LULO_API_KEY',
} as const;

export const ENV_SCHEMA = Joi.object({
  MONGODB_URL: Joi.string().required(),
  MONGODB_PASSWORD: Joi.string().required(),
  MONGODB_USERNAME: Joi.string().required(),
  SWAGGER_USER_ID: Joi.string().required(),
  SWAGGER_USER_PW: Joi.string().required(),
  OPENAI_API_KEY: Joi.string().required(),
  ANTHROPIC_API_KEY: Joi.string().required(),
  HELIUS_API_KEY: Joi.string().required(),
  SOLANA_ACCOUNT_PRIVATE_KEY: Joi.string().required(),
  EVM_ACCOUNT_PRIVATE_KEY: Joi.string().required(),
  LULO_API_KEY: Joi.string().required(),
});

export const ENV = cleanEnv(process.env, {
  MONGODB_URL: str(),
  MONGODB_PASSWORD: str(),
  MONGODB_USERNAME: str(),
  SWAGGER_USER_ID: str(),
  SWAGGER_USER_PW: str(),
  OPENAI_API_KEY: str(),
  ANTHROPIC_API_KEY: str(),
  HELIUS_API_KEY: str(),
  SOLANA_ACCOUNT_PRIVATE_KEY: str(),
  EVM_ACCOUNT_PRIVATE_KEY: str(),
  LULO_API_KEY: str(),
});
