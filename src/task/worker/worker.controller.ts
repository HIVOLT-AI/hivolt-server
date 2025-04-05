import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { WorkerService } from 'src/task/worker/worker.service';

@ApiTags('Worker')
@Controller('/api/worker')
export class WorkerController {
  constructor(private readonly workerService: WorkerService) {}

  @Get('run-all-task')
  async run_all_task() {
    return await this.workerService.run_all_task();
  }

  @Get('run-task/:id')
  async run_task(@Param('agent_id') agent_id: string) {
    return await this.workerService.run_task(agent_id);
  }

  @Get('run-test')
  async run_test() {
    return await this.workerService.run_test();
  }
}
