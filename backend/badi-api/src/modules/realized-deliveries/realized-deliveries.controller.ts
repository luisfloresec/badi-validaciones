import { Controller, Get, Post, Body, Param, Patch } from '@nestjs/common';
import { RealizedDeliveriesService } from './realized-deliveries.service';
import { CreateRealizedDeliveryDto } from './dto/create-realized-delivery.dto';

@Controller('realized-deliveries')
export class RealizedDeliveriesController {
  constructor(private readonly realizedDeliveriesService: RealizedDeliveriesService) {}

  @Post()
  create(@Body() createRealizedDeliveryDto: CreateRealizedDeliveryDto) {
    return this.realizedDeliveriesService.create(createRealizedDeliveryDto);
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

  @Patch(':id/annul')
  annul(@Param('id') id: string) {
    // Pendiente de implementación debido a la complejidad de restaurar estados en cascada
    throw new Error('Anulación de entregas realizadas no implementada todavía.');
  }
}
