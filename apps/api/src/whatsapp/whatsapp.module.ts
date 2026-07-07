import { Module } from '@nestjs/common';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappService } from './whatsapp.service';
import { WhatsappParseService } from './parse.service';

@Module({
  controllers: [WhatsappController],
  providers: [WhatsappService, WhatsappParseService],
})
export class WhatsappModule {}
