import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { SubmissionType, SubmissionStatus } from '@prisma/client';

export class CreateSubmissionDto {
  @ApiProperty({ enum: SubmissionType })
  @IsEnum(SubmissionType)
  type!: SubmissionType;

  @ApiProperty()
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(160)
  subject?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  message?: string;

  @ApiPropertyOptional({ description: 'Tipe özel ekstra alanlar' })
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}

export class SubmissionQueryDto {
  @ApiPropertyOptional({ enum: SubmissionType })
  @IsOptional()
  @IsEnum(SubmissionType)
  type?: SubmissionType;

  @ApiPropertyOptional({ enum: SubmissionStatus })
  @IsOptional()
  @IsEnum(SubmissionStatus)
  status?: SubmissionStatus;
}

export class UpdateSubmissionDto {
  @ApiProperty({ enum: SubmissionStatus })
  @IsEnum(SubmissionStatus)
  status!: SubmissionStatus;
}
