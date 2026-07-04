import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Organization } from '../organizations/entities/organization.entity';
import { Agreement } from '../agreements/entities/agreement.entity';
import { ScheduledDelivery } from '../schedules/entities/scheduled-delivery.entity';
import { RealizedDelivery } from '../realized-deliveries/entities/realized-delivery.entity';
import { Document } from '../documents/entities/document.entity';
import { User } from '../users/entities/user.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { ReportsModule } from '../reports/reports.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Organization,
      Agreement,
      ScheduledDelivery,
      RealizedDelivery,
      Document,
      User,
      AuditLog,
    ]),
    ReportsModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
