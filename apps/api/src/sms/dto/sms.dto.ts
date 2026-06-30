import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';

export class SendOtpDto {
  @ApiProperty({ example: '0535 000 00 00' })
  @IsString()
  @Length(7, 20)
  phone!: string;
}

export class VerifyOtpDto {
  @ApiProperty()
  @IsString()
  @Length(7, 20)
  phone!: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'Kod 6 haneli olmalı.' })
  code!: string;
}
