import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
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

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User | null> {
    if (updateUserDto.email) {
      updateUserDto.email = updateUserDto.email.toLowerCase();
    }
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }
    try {
      return await this.userModel
        .findByIdAndUpdate(id, updateUserDto, { new: true })
        .exec();
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Email already in use');
      }
      if (error.name === 'CastError') {
        throw new NotFoundException('User not found');
      }
      throw error;
    }
  }

  async findAll(page: number, limit: number, email?: string) {
    const filter: any = {};
    if (email) {
      filter.email = { $regex: email, $options: 'i' };
    }

    const users = await this.userModel
      .find(filter)
      .select('-password')
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    const total = await this.userModel.countDocuments(filter).exec();
    const data = users.map((user) => ({
      id: user._id,
      email: user.email,
      role: user.role,
    }));

    return { data, total, page, limit };
  }

  async seed(email: string, password: string): Promise<User> {
    const adminCount = await this.userModel
      .countDocuments({ role: Role.ADMIN })
      .exec();
    if (adminCount > 0) {
      throw new ConflictException('The admin user already exists');
    }
    return this.create(email, password, Role.ADMIN);
  }
}
