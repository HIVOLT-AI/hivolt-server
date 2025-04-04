import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from 'src/api/auth/auth.service';
import { CreateUserDto } from 'src/api/auth/auth.dto';

@ApiTags('Auth')
@Controller('/api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() data: CreateUserDto) {
    return await this.authService.login(data);
  }

  @Get(':id')
  async get_detail(@Param('user_id') user_id: string) {
    return await this.authService.get_detail(user_id);
  }
}
