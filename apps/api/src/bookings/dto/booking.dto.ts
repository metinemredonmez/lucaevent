import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class BookingItemDto {
  @ApiProperty()
  @IsString()
  tierId!: string;

  @ApiProperty({ minimum: 1, maximum: 50 })
  @IsInt()
  @Min(1)
  @Max(50) // sane per-item cap; prevents abuse and totalMinor overflow
  qty!: number;
}

export class BookingBuyerDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  fullName!: string;

  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  @MinLength(7)
  @MaxLength(40)
  phone!: string;
}

export class CreateBookingDto {
  @ApiProperty()
  @IsString()
  eventId!: string;

  @ApiProperty({ type: [BookingItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BookingItemDto)
  items!: BookingItemDto[];

  @ApiProperty({ type: BookingBuyerDto })
  @ValidateNested()
  @Type(() => BookingBuyerDto)
  buyer!: BookingBuyerDto;

  @ApiPropertyOptional({ description: 'Idempotency key for safe retries' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  idempotencyKey?: string;

  @ApiPropertyOptional({ description: 'İndirim/promosyon kodu' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  couponCode?: string;
}
