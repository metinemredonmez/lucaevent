import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { WaInboundStatus } from '@prisma/client';

/** wa-listener → API. Shared secret header (x-wa-secret) ile korunur. */
export class InboundWhatsappDto {
  @ApiProperty({ description: 'WhatsApp mesaj id — idempotency anahtarı' })
  @IsString()
  @MaxLength(200)
  waMessageId!: string;

  @ApiProperty({ description: 'Mesajın ham metni' })
  @IsString()
  @MaxLength(8000)
  text!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  groupName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  sender?: string;

  @ApiPropertyOptional({ description: 'R2/S3 medya URL listesi', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  mediaUrls?: string[];
}

export class InboundQueryDto {
  @ApiPropertyOptional({ enum: WaInboundStatus })
  @IsOptional()
  @IsEnum(WaInboundStatus)
  status?: WaInboundStatus;
}

/** Admin gelen mesajın parse alanlarını düzeltebilir. */
export class UpdateInboundDto {
  @ApiPropertyOptional({ enum: WaInboundStatus })
  @IsOptional()
  @IsEnum(WaInboundStatus)
  status?: WaInboundStatus;

  @ApiPropertyOptional({ description: 'Düzeltilmiş parse alanları (kısmi)' })
  @IsOptional()
  parsed?: Record<string, unknown>;
}
