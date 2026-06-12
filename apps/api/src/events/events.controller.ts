import { Controller, Get, Param, Query } from '@nestjs/common';
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
  @Get(':slug')
  one(@Param('slug') slug: string) {
    return this.events.bySlug(slug);
  }
}
