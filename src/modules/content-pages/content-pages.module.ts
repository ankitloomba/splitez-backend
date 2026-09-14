import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ContentPagesService } from './content-pages.service';
import {
  ContentPagesController,
  ContentPagesAdminController,
} from './content-pages.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ContentPagesController, ContentPagesAdminController],
  providers: [ContentPagesService],
  exports: [ContentPagesService],
})
export class ContentPagesModule {}
