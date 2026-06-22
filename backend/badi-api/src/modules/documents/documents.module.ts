import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentType } from './entities/document-type.entity';
import { Document } from './entities/document.entity';
import { R2StorageService } from './r2-storage.service';
import { DocumentTypesService } from './document-types.service';
import { DocumentTypesController } from './document-types.controller';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { Organization } from '../organizations/entities/organization.entity';
import { Agreement } from '../agreements/entities/agreement.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DocumentType, Document, Organization, Agreement])],
  controllers: [DocumentTypesController, DocumentsController],
  providers: [R2StorageService, DocumentTypesService, DocumentsService],
  exports: [R2StorageService, DocumentTypesService, DocumentsService],
})
export class DocumentsModule {}
