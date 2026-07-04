import { Controller, Get, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AuditService } from './audit.service';
import { Roles } from '../auth/decorators/roles.decorator';

@Roles('Administrador', 'Auditor')
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  findAll(@Query() query: any) {
    return this.auditService.findAll(query);
  }

  /** GET /audit/export — Exportar auditoría a Excel */
  @Get('export')
  async exportExcel(@Query() query: any, @Res() res: Response) {
    const workbook = await this.auditService.exportToExcel(query);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="auditoria.xlsx"');
    
    await workbook.xlsx.write(res);
    res.end();
  }
}
