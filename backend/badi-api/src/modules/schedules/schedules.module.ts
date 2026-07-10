import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchedulesService } from './schedules.service';
import { SchedulesController } from './schedules.controller';
import { ScheduledDelivery } from './entities/scheduled-delivery.entity';
import { Agreement } from '../agreements/entities/agreement.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { RealizedDelivery } from '../realized-deliveries/entities/realized-delivery.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ScheduledDelivery, Agreement, Organization, RealizedDelivery])],
  controllers: [SchedulesController],
  providers: [SchedulesService],
  exports: [SchedulesService],
})
export class SchedulesModule {}
