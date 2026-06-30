import { Controller, Get, Header, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { EventQueryDto } from './dto/event.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(private readonly events: EventsService) {}

  // canlı yayın meta (public) — URL yalnız PUBLIC+canlıda döner
  @Public()
  @Get(':slug/stream')
  streamMeta(@Param('slug') slug: string) {
    return this.events.streamMeta(slug);
  }

  // korumalı yayın URL'si — kimlik doğrulamalı (üye/ödeme yetkisi serviste kontrol edilir)
  @ApiBearerAuth()
  @Get(':slug/stream/play')
  streamPlay(@Param('slug') slug: string, @CurrentUser() user: CurrentUserPayload) {
    return this.events.streamPlay(slug, user.sub, user.role);
  }

  @Public()
  @Get()
  list(@Query() q: EventQueryDto) {
    return this.events.listPublic(q);
  }

  @Public()
  @Header('Content-Type', 'text/calendar; charset=utf-8')
  @Get(':slug/calendar.ics')
  ics(@Param('slug') slug: string) {
    return this.events.icsForSlug(slug);
  }

  @Public()
  @Get(':slug')
  one(@Param('slug') slug: string) {
    return this.events.bySlug(slug);
  }
}
