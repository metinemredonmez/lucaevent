import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsString,
  ValidateNested,
} from 'class-validator';

export class SettingItemDto {
  @ApiProperty({ example: 'push.onesignal.appId' })
  @IsString()
  key!: string;

  @ApiProperty({ description: 'Yeni değer (secret ise düz metin gönderilir, DB\'de şifrelenir)' })
  @IsString()
  value!: string;
}

export class UpdateSettingsDto {
  @ApiProperty({ type: [SettingItemDto] })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => SettingItemDto)
  items!: SettingItemDto[];
}
