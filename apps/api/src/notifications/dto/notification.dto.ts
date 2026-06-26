import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
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
