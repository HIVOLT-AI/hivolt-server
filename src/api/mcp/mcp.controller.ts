import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { McpService } from 'src/api/mcp/mcp.service';

@ApiTags('MCP')
@Controller('/api/mcp')
export class McpController {
  constructor(private readonly mcpService: McpService) {}

  @Get('list')
  async list() {
    return await this.mcpService.list();
  }

  @Get(':id')
  async get_detail(@Param('mcp_id') mcp_id: string) {
    return await this.mcpService.get_detail(mcp_id);
  }
}
