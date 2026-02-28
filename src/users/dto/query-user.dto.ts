import { IsOptional, IsNumberString } from 'class-validator';

export class QueryUserDto {
  @IsOptional()
  @IsNumberString()
  page?: string;

  @IsOptional()
  @IsNumberString()
  limit?: string;

  @IsOptional()
  email?: string;
}
