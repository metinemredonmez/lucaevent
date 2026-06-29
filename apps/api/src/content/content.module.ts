import { Module } from '@nestjs/common';
import {
  ContentAdminController,
  ContentPublicController,
} from './content.controller';
import { PostsService } from './posts.service';
import { PagesService } from './pages.service';

@Module({
  controllers: [ContentPublicController, ContentAdminController],
  providers: [PostsService, PagesService],
  exports: [PostsService, PagesService],
})
export class ContentModule {}
