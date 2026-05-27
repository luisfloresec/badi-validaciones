import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationsService } from './organizations.service';
import { OrganizationsController } from './organizations.controller';
import { Organization } from './entities/organization.entity';
import { OrganizationType } from '../organization-types/entities/organization-type.entity';
import { Catalog } from '../catalogs/entities/catalog.entity';
import { Representative } from '../representatives/entities/representative.entity';
import { AttendedGroup } from '../attended-groups/entities/attended-group.entity';
import { Leader } from '../leaders/entities/leader.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Organization, OrganizationType, Catalog, Representative, AttendedGroup, Leader])],
  controllers: [OrganizationsController],
  providers: [OrganizationsService],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
