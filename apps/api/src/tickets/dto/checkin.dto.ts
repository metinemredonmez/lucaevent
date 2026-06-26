import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CheckInDto {
  @ApiProperty({ description: 'IssuedTicket QR code' })
  @IsString()
  code!: string;
}
