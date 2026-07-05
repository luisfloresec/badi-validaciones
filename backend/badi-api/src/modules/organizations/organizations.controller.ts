import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
  StreamableFile,
} from '@nestjs/common';
import type { Response } from 'express';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { Roles } from '../auth/decorators/roles.decorator';

import { ReplaceRepresentativeDto } from './dto/replace-representative.dto';
import { CreateAttendedGroupWithLeaderDto } from './dto/create-group-with-leader.dto';

@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  /** POST /organizations — Crear una nueva organización */
  @Roles('Administrador', 'Gestión Social')
  @Post()
  create(@Body() createDto: CreateOrganizationDto) {
    return this.organizationsService.create(createDto);
  }

  /** GET /organizations/export — Exportar organizaciones a Excel */
  @Get('export')
  async exportExcel(
    @Query('searchTerm') searchTerm: string,
    @Query('estado') estado: string,
    @Query('tipoOrganizacion') tipoOrganizacion: string,
    @Res() res: Response
  ) {
    const workbook = await this.organizationsService.exportToExcel(searchTerm, estado, tipoOrganizacion);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="organizaciones.xlsx"');
    
    await workbook.xlsx.write(res);
    res.end();
  }

  /** GET /organizations — Listar organizaciones (por defecto no inactivas) */
  @Get()
  findAll(@Query('includeInactive') includeInactive?: string) {
    return this.organizationsService.findAll(includeInactive === 'true');
  }

  /** GET /organizations/ruc/:ruc — Buscar organización por RUC */
  @Get('ruc/:ruc')
  findByRuc(@Param('ruc') ruc: string) {
    return this.organizationsService.findByRuc(ruc);
  }

  /** GET /organizations/:id/full-detail — Detalle completo de la organización */
  @Get(':id/full-detail')
  getFullDetail(@Param('id', ParseUUIDPipe) id: string) {
    return this.organizationsService.getFullDetail(id);
  }

  /** GET /organizations/:id — Obtener organización por UUID */
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.organizationsService.findOne(id);
  }

  /** PATCH /organizations/:id — Actualizar datos de organización */
  @Roles('Administrador', 'Gestión Social')
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateOrganizationDto,
  ) {
    return this.organizationsService.update(id, updateDto);
  }

  /** PATCH /organizations/:id/deactivate — Desactivar organización */
  @Roles('Administrador', 'Gestión Social')
  @Patch(':id/deactivate')
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.organizationsService.deactivate(id);
  }

  /** PATCH /organizations/:id/activate — Reactivar organización */
  @Roles('Administrador')
  @Patch(':id/activate')
  activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.organizationsService.activate(id);
  }

  /** POST /organizations/:id/representatives/replace — Reemplazar representante activo */
  @Roles('Administrador', 'Gestión Social')
  @Post(':id/representatives/replace')
  replaceRepresentative(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReplaceRepresentativeDto,
  ) {
    return this.organizationsService.replaceRepresentative(id, dto);
  }

  @Roles('Administrador', 'Gestión Social')
  @Post(':id/attended-groups/with-leader')
  createAttendedGroupWithLeader(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateAttendedGroupWithLeaderDto,
  ) {
    return this.organizationsService.createAttendedGroupWithLeader(id, dto);
  }

  @Roles('Administrador', 'Gestión Social')
  @Get(':id/report')
  async getReport(@Param('id', ParseUUIDPipe) id: string, @Res({ passthrough: true }) res: Response) {
    const pdfDoc = await this.organizationsService.generateReport(id);
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="ficha-organizacion-${id.substring(0, 8)}.pdf"`,
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

  @Roles('Administrador', 'Gestión Social')
  @Get(':id/history')
  async getHistoryReport(@Param('id', ParseUUIDPipe) id: string, @Res({ passthrough: true }) res: Response) {
    const pdfDoc = await this.organizationsService.generateHistoryReport(id);
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="historial-organizacion-${id.substring(0, 8)}.pdf"`,
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
