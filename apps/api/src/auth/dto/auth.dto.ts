import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Equals,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@luca.test' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(8)
  password!: string;
}

export class RegisterDto extends LoginDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'KVKK aydınlatma metni onayı (zorunlu)' })
  @IsBoolean()
  @Equals(true, { message: 'KVKK onayı zorunludur' })
  kvkkConsent!: boolean;

  @ApiProperty({ description: 'Kullanım koşulları onayı (zorunlu)' })
  @IsBoolean()
  @Equals(true, { message: 'Kullanım koşulları onayı zorunludur' })
  termsAccepted!: boolean;

  @ApiPropertyOptional({ description: 'Ticari ileti / pazarlama izni (opsiyonel)' })
  @IsOptional()
  @IsBoolean()
  marketingOptIn?: boolean;

  // ── onboarding / profil (hepsi opsiyonel) ──
  @ApiPropertyOptional({ example: '+90 555 555 55 55' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;

  @ApiPropertyOptional({ example: 'İstanbul' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  city?: string;

  @ApiPropertyOptional({ example: '1998-05-12', description: 'ISO tarih' })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiPropertyOptional({ description: 'İlgi alanı kategori slugları', example: ['wellness', 'nightlife'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interests?: string[];
}

export class RefreshDto {
  @ApiProperty()
  @IsString()
  refreshToken!: string;
}

export class GoogleAuthDto {
  @ApiProperty({ description: 'Google ID token (JWT) from the client Google SDK' })
  @IsString()
  idToken!: string;
}

export class VerifyEmailDto {
  @ApiProperty()
  @IsString()
  token!: string;
}

export class ResendVerificationDto {
  @ApiProperty()
  @IsEmail()
  email!: string;
}

export class ForgotPasswordDto {
  @ApiProperty()
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  token!: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;
}

export class TokenPairDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;

  @ApiProperty()
  expiresIn!: number;
}
