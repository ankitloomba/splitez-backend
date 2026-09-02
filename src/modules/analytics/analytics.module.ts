import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { HealthAdminController } from './health-admin.controller';
import { HealthTrackingService } from './health.service';
import { HealthTrackingMiddleware } from './health.middleware';

@Module({
  controllers: [AnalyticsController, HealthAdminController],
  providers: [AnalyticsService, HealthTrackingService],
  exports: [HealthTrackingService],
})
export class AnalyticsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HealthTrackingMiddleware).forRoutes('*');
  }
}
