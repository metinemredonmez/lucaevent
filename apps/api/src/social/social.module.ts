import { Module } from '@nestjs/common';
import { FavoritesController } from './favorites.controller';
import { ReviewsController } from './reviews.controller';
import { FavoritesService } from './favorites.service';
import { ReviewsService } from './reviews.service';

@Module({
  controllers: [FavoritesController, ReviewsController],
  providers: [FavoritesService, ReviewsService],
  exports: [FavoritesService, ReviewsService],
})
export class SocialModule {}
