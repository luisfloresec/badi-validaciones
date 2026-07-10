import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { SchedulesService } from './schedules.service';
import { CreateScheduledDeliveryDto } from './dto/create-scheduled-delivery.dto';
import { UpdateScheduledDeliveryDto } from './dto/update-scheduled-delivery.dto';
import { RescheduleDeliveryDto } from './dto/reschedule-delivery.dto';
import { CancelDeliveryDto } from './dto/cancel-delivery.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('schedules')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Roles('Administrador', 'Gestión Social')
  @Post()
  create(@Body() createDto: CreateScheduledDeliveryDto) {
    return this.schedulesService.create(createDto);
  }

  @Get('stats')
  getStats() {
    return this.schedulesService.getStats();
  }

  @Get('by-agreement/:agreementId')
  findByAgreement(@Param('agreementId') agreementId: string) {
    return this.schedulesService.findByAgreement(agreementId);
  }

  @Get('board/export/excel')
  async exportBoardExcel(
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('agreementId') agreementId: string,
    @Query('organizationId') organizationId: string,
    @Query('estado') estado: string,
    @Res() res: Response
  ) {
    const workbook = await this.schedulesService.exportBoardExcel({ from, to, agreementId, organizationId, estado });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    const today = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Disposition', `attachment; filename="tablero-operativo-badi-${today}.xlsx"`);
    
    await workbook.xlsx.write(res);
    res.end();
  }

  @Get()
  findAll(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('agreementId') agreementId?: string,
    @Query('organizationId') organizationId?: string,
    @Query('estado') estado?: string,
  ) {
    return this.schedulesService.findAll({ from, to, agreementId, organizationId, estado });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.schedulesService.findOne(id);
  }

  @Roles('Administrador', 'Gestión Social')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateScheduledDeliveryDto) {
    return this.schedulesService.update(id, updateDto);
  }

  @Roles('Administrador', 'Gestión Social')
  @Patch(':id/reschedule')
  reschedule(@Param('id') id: string, @Body() rescheduleDto: RescheduleDeliveryDto) {
    return this.schedulesService.reschedule(id, rescheduleDto);
  }

  @Roles('Administrador', 'Gestión Social')
  @Patch(':id/cancel')
  cancel(@Param('id') id: string, @Body() cancelDto: CancelDeliveryDto) {
    return this.schedulesService.cancel(id, cancelDto);
  }
}
