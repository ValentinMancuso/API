import { IsEmail, IsNotEmpty, IsEnum } from 'class-validator';
import { Role } from '../schemas/user.schema';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  password: string;

  @IsEnum(Role)
  role: Role;
}
