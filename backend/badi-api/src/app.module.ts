import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from './modules/auth/guards/roles.guard';
import { RolesModule } from './modules/roles/roles.module';
import { UsersModule } from './modules/users/users.module';
import { UserRolesModule } from './modules/user-roles/user-roles.module';
import { CatalogsModule } from './modules/catalogs/catalogs.module';
import { OrganizationTypesModule } from './modules/organization-types/organization-types.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { RepresentativesModule } from './modules/representatives/representatives.module';
import { AttendedGroupsModule } from './modules/attended-groups/attended-groups.module';
import { LeadersModule } from './modules/leaders/leaders.module';
import { AgreementsModule } from './modules/agreements/agreements.module';
import { SchedulesModule } from './modules/schedules/schedules.module';
import { LocationsModule } from './modules/locations/locations.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { RealizedDeliveriesModule } from './modules/realized-deliveries/realized-deliveries.module';
import { AuditModule } from './modules/audit/audit.module';
import { SeedModule } from './modules/seed/seed.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ReportsModule } from './modules/reports/reports.module';
import { ClsModule } from 'nestjs-cls';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    ClsModule.forRoot({
      global: true,
      middleware: { mount: true },
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: Number(configService.get<string>('DB_PORT')),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        autoLoadEntities: true,
        synchronize: true,
      }),
    }),

    AuthModule,

    RolesModule,

    UsersModule,

    UserRolesModule,

    CatalogsModule,

    OrganizationTypesModule,

    OrganizationsModule,

    RepresentativesModule,

    AttendedGroupsModule,

    LeadersModule,

    AgreementsModule,

    SchedulesModule,

    LocationsModule,

    DocumentsModule,

    RealizedDeliveriesModule,

    AuditModule,

    SeedModule,

    DashboardModule,

    ReportsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Guards globales: primero autenticación, luego autorización por rol
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule { }

