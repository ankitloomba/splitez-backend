import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PeopleModule } from './modules/people/people.module';
import { GroupsModule } from './modules/groups/groups.module';
import { TripsModule } from './modules/trips/trips.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { BalancesModule } from './modules/balances/balances.module';
import { SettlementsModule } from './modules/settlements/settlements.module';
import { ActivityModule } from './modules/activity/activity.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { FinancesModule } from './modules/finances/finances.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { PromosModule } from './modules/promos/promos.module';
import { AdminModule } from './modules/admin/admin.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AdsModule } from './modules/ads/ads.module';
import { ExportsModule } from './modules/exports/exports.module';
import appConfig from './config/app.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    PeopleModule,
    GroupsModule,
    TripsModule,
    ExpensesModule,
    BalancesModule,
    SettlementsModule,
    ActivityModule,
    NotificationsModule,
    FinancesModule,
    CategoriesModule,
    PromosModule,
    AdminModule,
    DashboardModule,
    AnalyticsModule,
    AdsModule,
    ExportsModule,
  ],
})
export class AppModule {}
