import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { RegisterDto } from '../auth/dto/register.dto';
import { Role } from './schemas/user.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('seed')
  @ApiOperation({ summary: 'Create the first ADMIN user (One time only)' })
  async seed(@Body() body: RegisterDto) {
    const adminCount = await this.usersService.countAdmins();
    if (adminCount > 0) {
      throw new ConflictException('The admin user already exists');
    }
    const user = await this.usersService.create(
      body.email,
      body.password,
      Role.ADMIN,
    );
    return { id: user._id, email: user.email, role: user.role };
  }

  @Post()
  @ApiOperation({ summary: 'Create a user (ADMIN only)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(
      createUserDto.email,
      createUserDto.password,
      createUserDto.role,
    );
    return { id: user._id, email: user.email, role: user.role };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user by ID (ADMIN only)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const user = await this.usersService.update(id, updateUserDto);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return { id: user._id, email: user.email, role: user.role };
  }

  @Get()
  @ApiOperation({ summary: 'List users with pagination and search' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async findAll(@Query() query: QueryUserDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    return this.usersService.findAll(page, limit, query.email);
  }
}
