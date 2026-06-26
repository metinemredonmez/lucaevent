import { Controller, Get, Header, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { EventQueryDto } from './dto/event.dto';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(private readonly events: EventsService) {}

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
