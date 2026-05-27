import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttendedGroupsService } from './attended-groups.service';
import { AttendedGroupsController } from './attended-groups.controller';
import { AttendedGroup } from './entities/attended-group.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { Catalog } from '../catalogs/entities/catalog.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AttendedGroup, Organization, Catalog])],
  controllers: [AttendedGroupsController],
  providers: [AttendedGroupsService],
  exports: [AttendedGroupsService],
})
export class AttendedGroupsModule {}
