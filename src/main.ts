import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ENV } from 'src/config/env.config';
import * as basicAuth from 'express-basic-auth';
import {
  DocumentBuilder,
  SwaggerCustomOptions,
  SwaggerModule,
} from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Enable CORS
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*', // You can specify allowed origins or use '*' for all
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    // credentials: true, // Enable if you need to send cookies or authentication headers
  });


  app.useStaticAssets(join(__dirname, '..', 'public'), {
    prefix: '/static',
  });

  app.use(
    ['/docs', '/docs-json'],
    basicAuth({
      challenge: true,
      users: {
        [ENV.SWAGGER_USER_ID]: ENV.SWAGGER_USER_PW,
      },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('HiVolt API')
    .setDescription('API description')
    .setVersion('0.0.1')
    .build();

  const customOptions: SwaggerCustomOptions = {
    swaggerOptions: {
      persistAuthorization: true,
    },
  };

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, customOptions);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
