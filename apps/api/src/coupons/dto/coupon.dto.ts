import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { CouponType } from '@prisma/client';

export class CreateCouponDto {
  @ApiProperty({ example: 'YAZ25' })
  @IsString()
  @MaxLength(40)
  code!: string;

  @ApiProperty({ enum: CouponType })
  @IsEnum(CouponType)
  type!: CouponType;

  @ApiProperty({ description: 'PERCENT: 0-100 · FIXED: kuruş' })
  @IsInt()
  @Min(0)
  value!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  maxUses?: number;

  @ApiPropertyOptional({ description: 'Minimum sepet (kuruş)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  minSubtotalMinor?: number;

  @ApiPropertyOptional({ description: 'Belirli etkinliğe kısıtla (null = tümü)' })
  @IsOptional()
  @IsString()
  eventId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateCouponDto extends PartialType(CreateCouponDto) {}

export class ValidateCouponDto {
  @ApiProperty()
  @IsString()
  code!: string;

  @ApiProperty()
  @IsString()
  eventId!: string;

  @ApiProperty({ description: 'Sepet ara toplamı (kuruş)' })
  @IsInt()
  @Min(0)
  subtotalMinor!: number;
}
