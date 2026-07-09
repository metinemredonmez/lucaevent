import { Module } from '@nestjs/common';
import { VenuesController } from './venues.controller';
import { VenuesService } from './venues.service';
import { PlacesService } from './places.service';

@Module({
  controllers: [VenuesController],
  providers: [VenuesService, PlacesService],
  exports: [VenuesService],
})
export class VenuesModule {}
