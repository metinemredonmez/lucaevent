import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { WeatherBgService } from './weatherbg.service';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('weather-bg')
@Controller()
export class WeatherBgController {
  constructor(private readonly svc: WeatherBgService) {}

  // Havaya göre canlı arka plan → uygun görsele 302 redirect (Pexels ya da yerel).
  @Public()
  @Get('weather-bg')
  async bg(@Query('cond') cond: string, @Query('day') day: string, @Res() res: Response) {
    const url = await this.svc.resolve(cond || 'clear', day !== '0');
    res.set('Cache-Control', 'public, max-age=1800');
    // Helmet varsayılan CORP 'same-origin' → farklı origin'deki (lucaclub.com.tr)
    // sayfa bu görseli <img>/background olarak yükleyemez. Bu endpoint public bir
    // görsele yönlendiriyor; cross-origin kullanıma açıyoruz.
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    res.redirect(302, url);
  }
}
