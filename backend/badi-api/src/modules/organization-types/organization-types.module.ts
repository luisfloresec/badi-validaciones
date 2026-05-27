import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationTypesService } from './organization-types.service';
import { OrganizationTypesController } from './organization-types.controller';
import { OrganizationType } from './entities/organization-type.entity';

@Module({
  imports: [TypeOrmModule.forFeature([OrganizationType])],
  controllers: [OrganizationTypesController],
  providers: [OrganizationTypesService],
  exports: [OrganizationTypesService],
})
export class OrganizationTypesModule {}
