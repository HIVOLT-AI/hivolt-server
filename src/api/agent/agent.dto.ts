import { IsArray, IsNotEmpty, IsString } from 'class-validator';
import { Tool } from 'src/schema/tool.schema';
import { AgentStatus } from 'src/shared/types/agent';

export class CreateAgentDto {
  @IsNotEmpty()
  @IsString()
  name: string;
}

export class DeleteAgentDto {
  @IsNotEmpty()
  @IsString()
  agent_id: string;
}

export class AddToolDto {
  @IsNotEmpty()
  @IsString()
  agent_id: string;

  @IsNotEmpty()
  @IsArray()
  tools: Tool[];
}

export class UpdateStatusDto {
  @IsNotEmpty()
  @IsString()
  agent_id: string;

  @IsNotEmpty()
  @IsString()
  status: AgentStatus;
}
