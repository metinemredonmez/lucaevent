import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { ScoreService } from './score.service';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';

@ApiTags('score')
@Controller()
export class ScoreController {
  constructor(private readonly score: ScoreService) {}

  // kendi puanım — global JwtAuthGuard ile authed (giriş gerekir)
  @ApiBearerAuth()
  @Get('me/score')
  mine(@CurrentUser() user: CurrentUserPayload) {
    return this.score.forUser(user.sub);
  }

  // liderlik tablosu — public (ana sayfa vitrini + /topluluk). Adlar zaten anonimleştirilmiş ("Emre D.").
  @Public()
  @Get('community/leaderboard')
  leaderboard(@Query('take') take?: string) {
    const n = Math.min(50, Math.max(1, Number(take) || 20));
    return this.score.leaderboard(n);
  }
}
