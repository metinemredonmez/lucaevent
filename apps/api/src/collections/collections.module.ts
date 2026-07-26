import { Module } from '@nestjs/common';
import {
  CollectionsAdminController,
  CollectionsPublicController,
} from './collections.controller';
import { CollectionsService } from './collections.service';

@Module({
  controllers: [CollectionsPublicController, CollectionsAdminController],
  providers: [CollectionsService],
  exports: [CollectionsService],
})
export class CollectionsModule {}
