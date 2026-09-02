import { Module } from '@nestjs/common';
import { FinancesController } from './finances.controller';
import { FinancesService } from './finances.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [FinancesController],
  providers: [FinancesService],
  exports: [FinancesService],
})
export class FinancesModule {}
