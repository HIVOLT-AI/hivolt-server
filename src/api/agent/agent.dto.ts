import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';
import { Tool } from 'src/schema/tool.schema';
import { AgentStatus } from 'src/shared/types/agent';

export class CreateAgentDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  agent_id: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  owner_id: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  prompts: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  icon: string;
}

export class DeleteAgentDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  id: string;
}

export class AddToolDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsArray()
  tools: Tool[];
}

export class UpdateStatusDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  status: AgentStatus;
}
