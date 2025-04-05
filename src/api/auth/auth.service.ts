import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { User } from 'src/schema/user.schema';
import { CreateUserDto } from 'src/api/auth/auth.dto';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel('User')
    private readonly authModel: Model<User>,
  ) {}

  async login(data: CreateUserDto) {
    try {
      const user = await this.authModel.findOne({ address: data.address });

      if (user) {
        return user;
      }

      const newUser = await this.authModel.create({
        name: data.address,
        address: data.address,
      });

      return newUser;
    } catch (error) {
      throw new Error(`Error logging in: ${error.message}`);
    }
  }

  async get_detail(address: string) {
    return await this.authModel.findById(address);
  }
}
