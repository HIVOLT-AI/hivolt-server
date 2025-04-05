import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AgentSchema } from 'src/schema/agent.schema';
import { WorkerController } from 'src/task/worker/worker.controller';
import { WorkerService } from 'src/task/worker/worker.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Agent', schema: AgentSchema }]),
  ],
  controllers: [WorkerController],
  providers: [WorkerService],
})
export class WorkerModule {}
