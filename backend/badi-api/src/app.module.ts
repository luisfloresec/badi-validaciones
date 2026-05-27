import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RolesModule } from './modules/roles/roles.module';
import { UsersModule } from './modules/users/users.module';
import { UserRolesModule } from './modules/user-roles/user-roles.module';
import { CatalogsModule } from './modules/catalogs/catalogs.module';
import { OrganizationTypesModule } from './modules/organization-types/organization-types.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { RepresentativesModule } from './modules/representatives/representatives.module';
import { AttendedGroupsModule } from './modules/attended-groups/attended-groups.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
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

    RolesModule,

    UsersModule,

    UserRolesModule,

    CatalogsModule,

    OrganizationTypesModule,

    OrganizationsModule,

    RepresentativesModule,

    AttendedGroupsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
