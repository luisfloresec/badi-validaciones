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
import { AttendedGroupVulnerability } from '../attended-groups/entities/attended-group-vulnerability.entity';
import { Province } from '../locations/entities/province.entity';
import { City } from '../locations/entities/city.entity';
import { LocationsModule } from '../locations/locations.module';
import { ReportsModule } from '../reports/reports.module';
import { DocumentsModule } from '../documents/documents.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Organization, OrganizationType, Catalog, Representative,
      AttendedGroup, Leader, AttendedGroupVulnerability,
      Province, City,
    ]),
    LocationsModule,
    ReportsModule,
    DocumentsModule,
  ],
  controllers: [OrganizationsController],
  providers: [OrganizationsService],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}

