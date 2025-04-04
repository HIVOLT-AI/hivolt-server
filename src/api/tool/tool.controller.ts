import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ToolService } from 'src/api/tool/tool.service';

@ApiTags('Tool')
@Controller('/api/tool')
export class ToolController {
  constructor(private readonly toolService: ToolService) {}

  @Get('list')
  async list() {
    return await this.toolService.list();
  }

  @Get(':id')
  async get_detail(@Param('tool_id') tool_id: string) {
    return await this.toolService.get_detail(tool_id);
  }
}
