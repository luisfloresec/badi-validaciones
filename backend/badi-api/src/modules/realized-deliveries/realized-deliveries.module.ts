import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RealizedDeliveriesService } from './realized-deliveries.service';
import { RealizedDeliveriesController } from './realized-deliveries.controller';
import { RealizedDelivery } from './entities/realized-delivery.entity';
import { DocumentsModule } from '../documents/documents.module';

@Module({
  imports: [TypeOrmModule.forFeature([RealizedDelivery]), DocumentsModule],
  controllers: [RealizedDeliveriesController],
  providers: [RealizedDeliveriesService],
  exports: [RealizedDeliveriesService],
})
export class RealizedDeliveriesModule {}
