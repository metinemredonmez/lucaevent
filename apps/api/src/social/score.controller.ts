import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { ScoreService } from './score.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';

@ApiTags('score')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class ScoreController {
  constructor(private readonly score: ScoreService) {}

  @Get('me/score')
  mine(@CurrentUser() user: CurrentUserPayload) {
    return this.score.forUser(user.sub);
  }

  // liderlik tablosu — "kim en aktif" (üyeler birbirini görür, sohbet yok)
  @Get('community/leaderboard')
  leaderboard(@Query('take') take?: string) {
    const n = Math.min(50, Math.max(1, Number(take) || 20));
    return this.score.leaderboard(n);
  }
}
