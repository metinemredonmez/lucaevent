import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RadioService } from './radio.service';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('radio')
@Controller()
export class RadioController {
  constructor(private readonly radio: RadioService) {}

  // Canlı yayında o anki parça başlığı (ICY StreamTitle). Yoksa { title: null }.
  @Public()
  @Get('radio/now-playing')
  nowPlaying(@Query('url') url: string) {
    return this.radio.nowPlaying(url || '');
  }
}
