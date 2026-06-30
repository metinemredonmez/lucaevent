import { Module } from '@nestjs/common';
import { FavoritesController } from './favorites.controller';
import { ReviewsController } from './reviews.controller';
import { ScoreController } from './score.controller';
import { FavoritesService } from './favorites.service';
import { ReviewsService } from './reviews.service';
import { ScoreService } from './score.service';

@Module({
  controllers: [FavoritesController, ReviewsController, ScoreController],
  providers: [FavoritesService, ReviewsService, ScoreService],
  exports: [FavoritesService, ReviewsService],
})
export class SocialModule {}
