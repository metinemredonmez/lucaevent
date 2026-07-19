import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { EventKind, EventStatus, LiveStatus, StreamAccess } from '@prisma/client';

export class AgendaItemDto {
  @ApiProperty()
  @IsString()
  time!: string;

  @ApiProperty()
  @IsString()
  title!: string;
}

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

  @ApiPropertyOptional({ description: 'Radyo müziği sorgusu (örn. "italian"); boşsa kategoriye göre otomatik' })
  @IsOptional()
  @IsString()
  musicQuery?: string;

  @ApiPropertyOptional({ description: 'Radyo çip etiketi (örn. "İtalyan Akşamı")' })
  @IsOptional()
  @IsString()
  musicLabel?: string;

  @ApiPropertyOptional({ description: 'Category id (one of the 8 verticals)' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  // Declared as a plain shape (assignable to Prisma Json on `...dto` spread);
  // @Type(() => AgendaItemDto) still drives validation/whitelist via the class.
  @ApiPropertyOptional({ type: [AgendaItemDto], description: 'Program' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AgendaItemDto)
  agenda?: { time: string; title: string }[];

  @ApiPropertyOptional({ type: [String], description: 'Dahil olanlar' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  included?: string[];

  @ApiPropertyOptional({ type: [String], description: 'Yanında getir' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  bringList?: string[];

  @ApiPropertyOptional({ description: 'Minimum yaş' })
  @IsOptional()
  @IsInt()
  @Min(0)
  ageMin?: number;

  @ApiPropertyOptional({ description: 'Rezervasyon / gün-paketi yapılandırması (paketler, meze, paddle, program, menü görseli)' })
  @IsOptional()
  @IsObject()
  reservation?: Record<string, unknown>;

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

  // ---- canlı yayın ----
  @ApiPropertyOptional({ enum: LiveStatus })
  @IsOptional()
  @IsEnum(LiveStatus)
  liveStatus?: LiveStatus;

  @ApiPropertyOptional({ description: 'Yayın URL (HLS .m3u8 / YouTube / embed)' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  streamUrl?: string;

  @ApiPropertyOptional({ enum: StreamAccess })
  @IsOptional()
  @IsEnum(StreamAccess)
  streamAccess?: StreamAccess;

  @ApiPropertyOptional({ description: 'PAID izleme ücreti (kuruş)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  streamPriceMinor?: number;
}

export class SetLiveDto {
  @ApiProperty()
  @IsBoolean()
  live!: boolean;
}

export class EventQueryDto {
  @ApiPropertyOptional({ enum: EventKind })
  @IsOptional()
  @IsEnum(EventKind)
  kind?: EventKind;

  @ApiPropertyOptional({ description: 'Filter by category id' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'upcoming | past | today | tomorrow | weekend',
    enum: ['upcoming', 'past', 'today', 'tomorrow', 'weekend'],
  })
  @IsOptional()
  @IsIn(['upcoming', 'past', 'today', 'tomorrow', 'weekend'])
  range?: 'upcoming' | 'past' | 'today' | 'tomorrow' | 'weekend';

  @ApiPropertyOptional({ description: 'Ücretsiz etkinlikler (priceMinor=0 tier)' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  free?: boolean;

  @ApiPropertyOptional({ description: 'Tam metin arama (başlık/tagline/açıklama)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @ApiPropertyOptional({ description: 'Konum enlem (near için)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lat?: number;

  @ApiPropertyOptional({ description: 'Konum boylam (near için)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lng?: number;

  @ApiPropertyOptional({ description: 'Yarıçap km (lat/lng ile)', default: 25 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  radiusKm?: number;

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
