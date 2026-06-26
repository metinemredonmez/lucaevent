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

import { FavoritesService } from './favorites.service';
import { AddFavoriteDto } from './dto/social.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../common/decorators/current-user.decorator';

@ApiTags('favorites')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class FavoritesController {
  constructor(private readonly favorites: FavoritesService) {}

  @Get('me/favorites')
  list(@CurrentUser() user: CurrentUserPayload) {
    return this.favorites.list(user.sub);
  }

  @Post('me/favorites')
  add(@Body() dto: AddFavoriteDto, @CurrentUser() user: CurrentUserPayload) {
    return this.favorites.add(user.sub, dto.eventId);
  }

  @Delete('me/favorites/:eventId')
  remove(
    @Param('eventId') eventId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.favorites.remove(user.sub, eventId);
  }
}
