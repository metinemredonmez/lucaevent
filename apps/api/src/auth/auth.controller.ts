import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { AuthService } from './auth.service';
import {
  ForgotPasswordDto,
  GoogleAuthDto,
  LoginDto,
  RefreshDto,
  RegisterDto,
  ResendVerificationDto,
  ResetPasswordDto,
  TokenPairDto,
  VerifyEmailDto,
} from './dto/auth.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('register')
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @ApiOkResponse({ type: TokenPairDto })
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @ApiOkResponse({ type: TokenPairDto })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Public()
  @Get('google/config')
  googleConfig() {
    return this.auth.googleConfig();
  }

  @Public()
  @Post('google')
  @HttpCode(200)
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @ApiOkResponse({ type: TokenPairDto })
  google(@Body() dto: GoogleAuthDto) {
    return this.auth.loginWithGoogle(dto.idToken);
  }

  @Public()
  @Post('verify-email')
  @HttpCode(200)
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.auth.verifyEmail(dto.token);
  }

  @Public()
  @Post('resend-verification')
  @HttpCode(200)
  @Throttle({ default: { ttl: 60_000, limit: 3 } })
  resendVerification(@Body() dto: ResendVerificationDto) {
    return this.auth.resendVerification(dto.email);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(200)
  @Throttle({ default: { ttl: 60_000, limit: 3 } })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto.email);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(200)
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto.token, dto.password);
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  @ApiOkResponse({ type: TokenPairDto })
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('logout')
  @HttpCode(200)
  logout(@Body() dto: RefreshDto) {
    return this.auth.logout(dto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me')
  me(@CurrentUser() user: CurrentUserPayload) {
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete('account')
  @HttpCode(200)
  deleteAccount(@CurrentUser() user: CurrentUserPayload) {
    return this.auth.deleteAccount(user.sub);
  }
}
