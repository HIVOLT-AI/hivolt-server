import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ENV } from 'src/config/env.config';
import * as basicAuth from 'express-basic-auth';
import {
  DocumentBuilder,
  SwaggerCustomOptions,
  SwaggerModule,
} from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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
