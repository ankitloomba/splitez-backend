import { Module } from '@nestjs/common';
import { AdsController, AdsAdminController } from './ads.controller';
import { AdsService } from './ads.service';

@Module({
  controllers: [AdsController, AdsAdminController],
  providers: [AdsService],
})
export class AdsModule {}
