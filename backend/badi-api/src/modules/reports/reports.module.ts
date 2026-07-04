import { Module, Global } from '@nestjs/common';
import { PdfGeneratorService } from './services/pdf-generator.service';
import { ExcelGeneratorService } from './services/excel-generator.service';

/**
 * ReportsModule (Interno)
 * 
 * Este módulo provee utilidades estandarizadas para la generación de PDFs y Excels.
 * Es global para estar disponible en todos los módulos (Agreements, Organizations, etc.)
 */
@Global()
@Module({
  providers: [PdfGeneratorService, ExcelGeneratorService],
  exports: [PdfGeneratorService, ExcelGeneratorService],
})
export class ReportsModule {}
