import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationsService } from './organizations.service';
import { OrganizationsController } from './organizations.controller';
import { Organization } from './entities/organization.entity';
import { OrganizationType } from '../organization-types/entities/organization-type.entity';
import { Catalog } from '../catalogs/entities/catalog.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Organization, OrganizationType, Catalog])],
  controllers: [OrganizationsController],
  providers: [OrganizationsService],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
