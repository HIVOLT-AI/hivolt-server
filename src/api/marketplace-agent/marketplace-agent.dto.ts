import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber } from "class-validator";
import { IsString } from "class-validator";

export class GetMarketplaceAgentsDto {
  constructor(
    agent_id: string,
    agent_name: string,
    agent_description: string,
    icon: string,
    install_count: number,
  ) {
    this.agent_id = agent_id;
    this.agent_name = agent_name;
    this.agent_description = agent_description;
    this.icon = icon;
    this.install_count = install_count;
  }

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  agent_id: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  agent_name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  agent_description: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  icon: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  install_count: number;
}

export class SaveMarketplaceAgentDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  owner_id: string;
}

