import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { WaitlistService } from './waitlist.service';
import { JoinWaitlistDto } from './dto/waitlist.dto';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../common/decorators/current-user.decorator';

@ApiTags('waitlist')
@Controller()
export class WaitlistController {
  constructor(private readonly waitlist: WaitlistService) {}

  // Guest checkout parity: public join, matched to the account by email later.
  @Public()
  @Post('events/:slug/waitlist')
  join(@Param('slug') slug: string, @Body() dto: JoinWaitlistDto) {
    return this.waitlist.join(slug, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me/waitlist')
  mine(@CurrentUser() user: CurrentUserPayload) {
    return this.waitlist.listMine(user);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete('me/waitlist/:id')
  leave(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.waitlist.leave(user, id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.EDITOR)
  @Get('admin/events/:id/waitlist')
  forEvent(@Param('id') id: string) {
    return this.waitlist.listForEvent(id);
  }
}
