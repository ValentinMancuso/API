import { Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, Role } from './schemas/user.schema';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async create(email: string, password: string, role: Role): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new this.userModel({
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
    });
    try {
      return await user.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Email already in use');
      }
      throw error;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  async findById(id: string): Promise<User | null> {
    return this.userModel.findById(id).exec();
  }

  async update(id: string, attrs: UpdateUserDto): Promise<User | null> {
    if (attrs.password) {
      attrs.password = await bcrypt.hash(attrs.password, 10);
    }
    return this.userModel.findByIdAndUpdate(id, attrs, { new: true }).exec();
  }

  async findAll(page: number, limit: number, email?: string) {
    const filter: any = {};
    if (email) {
      filter.email = { $regex: email, $options: 'i' };
    }

    const data = await this.userModel
      .find(filter)
      .select('-password')
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    const total = await this.userModel.countDocuments(filter).exec();

    return { data, total, page, limit };
  }

  async countAdmins(): Promise<number> {
    return this.userModel.countDocuments({ role: Role.ADMIN }).exec();
  }
}
