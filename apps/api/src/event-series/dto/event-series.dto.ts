import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { EventKind, RecurrenceFreq } from '@prisma/client';

export class AgendaItemDto {
  @ApiProperty()
  @IsString()
  time!: string;

  @ApiProperty()
  @IsString()
  title!: string;
}

export class TierTemplateDto {
  @ApiProperty()
  @IsString()
  @MaxLength(80)
  name!: string;

  @ApiProperty({ description: 'Fiyat (kuruş)' })
  @IsInt()
  @Min(0)
  priceMinor!: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  capacity!: number;
}

export class CreateEventSeriesDto {
  @ApiProperty()
  @IsString()
  @MaxLength(120)
  title!: string;

  @ApiProperty({ description: 'Occurrence slug ön eki (her seans: slug-YYYY-MM-DD)' })
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  venueId?: string;

  @ApiPropertyOptional({ type: [AgendaItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AgendaItemDto)
  agenda?: AgendaItemDto[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  included?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  bringList?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  ageMin?: number;

  // recurrence
  @ApiProperty({ enum: RecurrenceFreq })
  @IsEnum(RecurrenceFreq)
  freq!: RecurrenceFreq;

  @ApiProperty({ default: 1, description: 'Her N freq biriminde (haftada/günde)' })
  @IsInt()
  @Min(1)
  @Max(52)
  interval!: number;

  @ApiProperty({ type: [Number], description: '0=Pazar..6=Cumartesi (WEEKLY için)' })
  @IsArray()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  weekdays!: number[];

  @ApiProperty({ description: 'ISO başlangıç tarihi' })
  @IsDateString()
  startDate!: string;

  @ApiPropertyOptional({ description: 'ISO bitiş (yoksa +90 gün ufuk)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ example: '18:30', description: 'HH:mm (mekan yerel saati)' })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'startTime HH:mm formatında olmalı' })
  startTime!: string;

  @ApiProperty({ default: 60 })
  @IsInt()
  @Min(5)
  @Max(1440)
  durationMin!: number;

  @ApiProperty({
    type: [TierTemplateDto],
    description: 'Her occurrence için bilet şablonu',
  })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => TierTemplateDto)
  tierTemplate!: TierTemplateDto[];
}

export class GenerateDto {
  @ApiPropertyOptional({ description: 'ISO — bu tarihe kadar üret (yoksa endDate/+90g)' })
  @IsOptional()
  @IsDateString()
  until?: string;
}
