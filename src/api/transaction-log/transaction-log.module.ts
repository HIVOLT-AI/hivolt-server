import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TransactionLogController } from './transaction-log.controller';
import { TransactionLogService } from './transaction-log.service';
import { TransactionLogSchema } from 'src/schema/transaction-log.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'TransactionLog', schema: TransactionLogSchema },
    ]),
  ],
  controllers: [TransactionLogController],
  providers: [TransactionLogService],
  exports: [TransactionLogService],
})
export class TransactionLogModule {} 