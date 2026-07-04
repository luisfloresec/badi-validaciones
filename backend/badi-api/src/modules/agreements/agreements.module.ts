import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgreementsService } from './agreements.service';
import { AgreementsController } from './agreements.controller';
import { Agreement } from './entities/agreement.entity';
import { AgreementType } from './entities/agreement-type.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { ReportsModule } from '../reports/reports.module';
import { DocumentsModule } from '../documents/documents.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Agreement, AgreementType, Organization]),
    ReportsModule,
    DocumentsModule
  ],
  controllers: [AgreementsController],
  providers: [AgreementsService],
  exports: [AgreementsService],
})
export class AgreementsModule {}
