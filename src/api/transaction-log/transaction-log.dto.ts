import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsDate } from 'class-validator';

export class CreateTransactionLogDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  user_agent_id: string;

  @ApiProperty()
  @IsString()
  tool_id: string;

  @ApiProperty()
  @IsString()
  tool_name: string;

  @ApiProperty()
  @IsString()
  log: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  owner_id: string;

  @ApiProperty()
  @IsString()
  status: string;

  @ApiProperty()
  @IsString()
  solscan_url: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  tx_hash: string;

  @ApiProperty()
  @IsDate()
  @IsNotEmpty()
  date: Date;
} 