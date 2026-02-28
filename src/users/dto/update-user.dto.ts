import { IsEmail, IsOptional, IsEnum, IsNotEmpty } from 'class-validator';
import { Role } from '../schemas/user.schema';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsNotEmpty()
  password?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
