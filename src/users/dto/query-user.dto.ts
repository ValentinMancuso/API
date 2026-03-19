import { IsOptional, IsNumber, Min, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryUserDto {
  @ApiPropertyOptional({ description: 'Page number', example: 1 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ description: 'Results per page', example: 20 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(1)
  limit: number = 20;

  @ApiPropertyOptional({
    description: 'Filter by email',
    example: 'user@example.com',
  })
  @IsOptional()
  @IsString()
  email?: string;
}
