import { IsNotEmpty, IsString } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  address: string;

  @IsNotEmpty()
  @IsString()
  signature: Uint8Array;

  @IsNotEmpty()
  @IsString()
  message: string;
}
