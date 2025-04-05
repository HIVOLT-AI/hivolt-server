import { Logger, Module } from '@nestjs/common';
import { AppController } from 'src/app.controller';
import { AppService } from 'src/app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import AGENT_ENV from 'src/env/agent.env';
import MONGODB_ENV from 'src/env/mongodb.env';
import ACCOUNT_ENV from 'src/env/account.env';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from 'src/api/auth/auth.module';
import { AgentModule } from 'src/api/agent/agent.module';
import { APP_FILTER, MiddlewareBuilder } from '@nestjs/core';
import { HttpExceptionFilter } from 'src/shared/utils/http-exception.filter';
import { LoggerMiddleware } from 'src/shared/middleware/logger.middleware';
import { ToolModule } from 'src/api/tool/tool.module';
import { McpModule } from 'src/api/mcp/mcp.module';
import { MarketplaceAgentModule } from './api/marketplace-agent/marketplace-agent.module';
import { SavedAgentModule } from './api/saved-agent/saved-agent.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { TransactionLogModule } from './api/transaction-log/transaction-log.module';
import { WorkerModule } from './task/worker/worker.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env`,
      load: [AGENT_ENV, MONGODB_ENV, ACCOUNT_ENV],
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/static',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB.URI'),
        user: configService.get<string>('MONGODB.USER'),
        pass: configService.get<string>('MONGODB.PASS'),
      }),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    AgentModule,
    ToolModule,
    McpModule,
    MarketplaceAgentModule,
    SavedAgentModule,
    TransactionLogModule,
    WorkerModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    Logger,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareBuilder): void {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
