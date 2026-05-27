import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RepresentativesService } from './representatives.service';
import { RepresentativesController } from './representatives.controller';
import { Representative } from './entities/representative.entity';
import { Organization } from '../organizations/entities/organization.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Representative, Organization])],
  controllers: [RepresentativesController],
  providers: [RepresentativesService],
  exports: [RepresentativesService],
})
export class RepresentativesModule {}
