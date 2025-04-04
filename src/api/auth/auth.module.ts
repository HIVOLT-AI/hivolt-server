import { Module } from '@nestjs/common';
import { AuthController } from 'src/api/auth/auth.controller';
import { AuthService } from 'src/api/auth/auth.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from 'src/schema/user.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'User', schema: UserSchema }])],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
