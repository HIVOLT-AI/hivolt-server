import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AgentSchema } from 'src/schema/agent.schema';
import { TradeController } from 'src/task/worker/worker.controller';
import { WorkerService } from 'src/task/worker/worker.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Agent', schema: AgentSchema }]),
  ],
  controllers: [TradeController],
  providers: [WorkerService],
})
export class WorkerModule {}
