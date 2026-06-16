import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
} from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { CreateScheduledDeliveryDto } from './dto/create-scheduled-delivery.dto';
import { UpdateScheduledDeliveryDto } from './dto/update-scheduled-delivery.dto';
import { RescheduleDeliveryDto } from './dto/reschedule-delivery.dto';
import { CancelDeliveryDto } from './dto/cancel-delivery.dto';

@Controller('schedules')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

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

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateScheduledDeliveryDto) {
    return this.schedulesService.update(id, updateDto);
  }

  @Patch(':id/reschedule')
  reschedule(@Param('id') id: string, @Body() rescheduleDto: RescheduleDeliveryDto) {
    return this.schedulesService.reschedule(id, rescheduleDto);
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string, @Body() cancelDto: CancelDeliveryDto) {
    return this.schedulesService.cancel(id, cancelDto);
  }
}
