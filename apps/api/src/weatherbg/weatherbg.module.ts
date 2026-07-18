import { Module } from '@nestjs/common';
import { WeatherBgController } from './weatherbg.controller';
import { WeatherBgService } from './weatherbg.service';

@Module({
  controllers: [WeatherBgController],
  providers: [WeatherBgService],
})
export class WeatherBgModule {}
