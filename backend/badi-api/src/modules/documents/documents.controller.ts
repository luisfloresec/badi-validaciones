import {
  Controller,
  Post,
  Get,
  Param,
  UseInterceptors,
  UploadedFile,
  Body,
  ParseUUIDPipe,
  Res,
  HttpCode,
  HttpStatus,
  ParseFilePipe,
  MaxFileSizeValidator,
  Query,
  Patch,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { ReplaceDocumentDto } from './dto/replace-document.dto';
import { DocumentFiltersDto } from './dto/document-filters.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Roles('Administrador', 'Gestión Social')
  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          // Límite conservador a nivel de controlador (100MB). El servicio valida el max por tipo.
          new MaxFileSizeValidator({ maxSize: 100 * 1024 * 1024 }),
        ],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
    @Body() dto: CreateDocumentDto,
  ) {
    return this.documentsService.upload(dto, file);
  }

  @Get(':id/download')
  async download(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ) {
    const { stream, document } = await this.documentsService.getDownloadStream(id);
    
    // Configurar cabeceras para descarga de archivo
    res.set({
      'Content-Type': document.mimeType,
      'Content-Disposition': `attachment; filename="${document.nombreOriginal}"`,
      'Content-Length': document.tamanoBytes,
    });

    stream.pipe(res);
  }

  @Get(':id/view')
  async view(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ) {
    const { stream, document } = await this.documentsService.getDownloadStream(id);
    
    // Configurar cabeceras para visualización en el navegador
    res.set({
      'Content-Type': document.mimeType,
      'Content-Disposition': `inline; filename="${document.nombreOriginal}"`,
      'Content-Length': document.tamanoBytes,
    });

    stream.pipe(res);
  }

  @Get()
  async findAll(@Query() filters: DocumentFiltersDto) {
    return this.documentsService.findAll(filters);
  }

  /** GET /documents/export — Exportar documentos a Excel */
  @Get('export')
  async exportExcel(@Query() filters: DocumentFiltersDto, @Res() res: Response) {
    const workbook = await this.documentsService.exportToExcel(filters);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="documentos.xlsx"');
    
    await workbook.xlsx.write(res);
    res.end();
  }

  @Get('stats')
  async getStats() {
    return this.documentsService.getStats();
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentsService.findOne(id);
  }

  @Roles('Administrador', 'Gestión Social')
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDocumentDto: UpdateDocumentDto,
  ) {
    return this.documentsService.update(id, updateDocumentDto);
  }

  @Roles('Administrador', 'Gestión Social')
  @Patch(':id/replace')
  @UseInterceptors(FileInterceptor('file'))
  async replace(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 100 * 1024 * 1024 }),
        ],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
    @Body() dto: ReplaceDocumentDto,
  ) {
    return this.documentsService.replace(id, dto, file);
  }

  @Roles('Administrador', 'Gestión Social')
  @Patch(':id/deactivate')
  async deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentsService.deactivate(id);
  }

  @Roles('Administrador', 'Gestión Social')
  @Patch(':id/annul')
  async annul(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentsService.annul(id);
  }
}
