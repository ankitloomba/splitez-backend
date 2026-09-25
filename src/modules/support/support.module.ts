import { Module } from '@nestjs/common';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { EmailService } from '../auth/email.service';

@Module({
  imports: [PrismaModule],
  controllers: [SupportController],
  providers: [SupportService, EmailService],
  exports: [SupportService],
})
export class SupportModule {}
