import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { ScoreService } from './score.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';

@ApiTags('me/score')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class ScoreController {
  constructor(private readonly score: ScoreService) {}

  @Get('me/score')
  mine(@CurrentUser() user: CurrentUserPayload) {
    return this.score.forUser(user.sub);
  }
}
