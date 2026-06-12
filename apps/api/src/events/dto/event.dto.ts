import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
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
import { EventKind, EventStatus } from '@prisma/client';

export class EventCreateDto {
  @ApiProperty()
  @IsString()
  @MaxLength(120)
  title!: string;

  @ApiProperty({ description: 'URL-safe slug, kebab-case' })
  @IsString()
  @MaxLength(120)
  slug!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  tagline?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: EventKind })
  @IsEnum(EventKind)
  kind!: EventKind;

  @ApiProperty({ description: 'ISO date string' })
  @IsDateString()
  startsAt!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  doorsAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  venueId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  campingAllowed?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  campMapUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  travelInfo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  seoTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  seoDesc?: string;
}

export class EventUpdateDto extends PartialType(EventCreateDto) {
  @ApiPropertyOptional({ enum: EventStatus })
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;
}

export class EventQueryDto {
  @ApiPropertyOptional({ enum: EventKind })
  @IsOptional()
  @IsEnum(EventKind)
  kind?: EventKind;

  @ApiPropertyOptional({ description: 'upcoming | past' })
  @IsOptional()
  @IsString()
  range?: 'upcoming' | 'past';

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  take?: number = 20;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number = 0;
}
