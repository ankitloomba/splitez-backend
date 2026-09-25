import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminAuthController } from './admin-auth.controller';
import { AdminAuthService } from './admin-auth.service';
import { SupportModule } from '../support/support.module';

@Module({
  imports: [SupportModule],
  controllers: [AdminController, AdminAuthController],
  providers: [AdminService, AdminAuthService],
})
export class AdminModule {}
