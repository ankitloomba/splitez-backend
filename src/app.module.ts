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
  ],
})
export class AppModule {}
