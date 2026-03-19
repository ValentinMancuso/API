import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { RegisterDto } from '../auth/dto/register.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from './schemas/user.schema';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('seed')
  @ApiOperation({ summary: 'Create the first ADMIN user (One time only)' })
  async seed(@Body() body: RegisterDto) {
    const user = await this.usersService.seed(body.email, body.password);
    return { id: user._id, email: user.email, role: user.role };
  }

  @Post()
  @ApiOperation({ summary: 'Create a user (ADMIN only)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
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
  @Roles(Role.ADMIN)
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
    return this.usersService.findAll(query.page, query.limit, query.email);
  }
}
