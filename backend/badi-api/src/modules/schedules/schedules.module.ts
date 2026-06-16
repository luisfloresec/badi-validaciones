import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchedulesService } from './schedules.service';
import { SchedulesController } from './schedules.controller';
import { ScheduledDelivery } from './entities/scheduled-delivery.entity';
import { Agreement } from '../agreements/entities/agreement.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ScheduledDelivery, Agreement])],
  controllers: [SchedulesController],
  providers: [SchedulesService],
  exports: [SchedulesService],
})
export class SchedulesModule {}
