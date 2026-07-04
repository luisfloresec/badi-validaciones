import { Controller, Get, Res, StreamableFile } from '@nestjs/common';
import type { Response } from 'express';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  async getSummary() {
    return this.dashboardService.getSummary();
  }

  @Get('report')
  async getReport(@Res({ passthrough: true }) res: Response) {
    const pdfDoc = await this.dashboardService.generateDashboardReport();
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="dashboard-badi-${new Date().getFullYear()}${(new Date().getMonth()+1).toString().padStart(2, '0')}.pdf"`,
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
