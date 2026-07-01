import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class BroadcastDto {
  @ApiProperty()
  @IsString()
  @MaxLength(120)
  title!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(400)
  message!: string;

  @ApiPropertyOptional({ description: 'Bildirime tıklayınca açılacak URL' })
  @IsOptional()
  @IsString()
  url?: string;

  @ApiPropertyOptional({
    description: 'OneSignal segment (varsayılan: "Subscribed Users")',
  })
  @IsOptional()
  @IsString()
  segment?: string;
}

/** Detaylı gönderim: hedef (herkes / etkinlik) + kanal (uygulama-içi / push). */
export class DispatchDto {
  @ApiProperty()
  @IsString()
  @MaxLength(120)
  title!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(400)
  message!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  url?: string;

  @ApiProperty({ enum: ['all', 'event'] })
  @IsIn(['all', 'event'])
  target!: 'all' | 'event';

  @ApiPropertyOptional({ description: 'target=event iken zorunlu' })
  @IsOptional()
  @IsString()
  eventId?: string;

  @ApiProperty({ description: 'uygulama-içi (çan) bildirim gönder' })
  @IsBoolean()
  inapp!: boolean;

  @ApiProperty({ description: 'push (OneSignal) gönder' })
  @IsBoolean()
  push!: boolean;
}

export class SendToUsersDto {
  @ApiProperty({
    type: [String],
    description: 'OneSignal external user id listesi (= Luca user.id)',
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  userIds!: string[];

  @ApiProperty()
  @IsString()
  @MaxLength(120)
  title!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(400)
  message!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  url?: string;
}
