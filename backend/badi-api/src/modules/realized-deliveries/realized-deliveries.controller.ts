import { Controller, Get, Post, Body, Param, Patch, Res, StreamableFile, Query } from '@nestjs/common';
import type { Response } from 'express';
import { RealizedDeliveriesService } from './realized-deliveries.service';
import { CreateRealizedDeliveryDto } from './dto/create-realized-delivery.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('realized-deliveries')
export class RealizedDeliveriesController {
  constructor(private readonly realizedDeliveriesService: RealizedDeliveriesService) {}

  @Roles('Administrador', 'Gestión Social')
  @Post()
  create(@Body() createRealizedDeliveryDto: CreateRealizedDeliveryDto) {
    return this.realizedDeliveriesService.create(createRealizedDeliveryDto);
  }

  @Get('export')
  async exportExcel(
    @Query('searchTerm') searchTerm: string,
    @Query('estado') estado: string,
    @Res() res: Response
  ) {
    const workbook = await this.realizedDeliveriesService.exportToExcel(searchTerm, estado);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="entregas-realizadas.xlsx"');
    
    await workbook.xlsx.write(res);
    res.end();
  }

  @Get()
  findAll() {
    return this.realizedDeliveriesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.realizedDeliveriesService.findOne(id);
  }

  @Get('by-agreement/:agreementId')
  findByAgreement(@Param('agreementId') agreementId: string) {
    return this.realizedDeliveriesService.findByAgreement(agreementId);
  }

  @Get('by-organization/:organizationId')
  findByOrganization(@Param('organizationId') organizationId: string) {
    return this.realizedDeliveriesService.findByOrganization(organizationId);
  }

  @Get('by-schedule/:scheduleId')
  findBySchedule(@Param('scheduleId') scheduleId: string) {
    return this.realizedDeliveriesService.findBySchedule(scheduleId);
  }

  @Roles('Administrador', 'Gestión Social')
  @Patch(':id/annul')
  annul(@Param('id') id: string) {
    // Pendiente de implementación debido a la complejidad de restaurar estados en cascada
    throw new Error('Anulación de entregas realizadas no implementada todavía.');
  }

  @Roles('Administrador', 'Gestión Social')
  @Get(':id/report')
  async getReport(@Param('id') id: string, @Res({ passthrough: true }) res: Response) {
    const pdfDoc = await this.realizedDeliveriesService.generateReport(id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Reporte_Entrega_${id.substring(0, 8)}.pdf"`,
    });

    const chunks: Buffer[] = [];
    return new Promise<StreamableFile>((resolve, reject) => {
      pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
      pdfDoc.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve(new StreamableFile(buffer));
      });
      pdfDoc.on('error', reject);
      pdfDoc.end();
    });
  }
}
