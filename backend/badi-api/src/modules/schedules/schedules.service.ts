import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, Not } from 'typeorm';
import { ScheduledDelivery } from './entities/scheduled-delivery.entity';
import { Agreement } from '../agreements/entities/agreement.entity';
import { CreateScheduledDeliveryDto } from './dto/create-scheduled-delivery.dto';
import { UpdateScheduledDeliveryDto } from './dto/update-scheduled-delivery.dto';
import { RescheduleDeliveryDto } from './dto/reschedule-delivery.dto';
import { CancelDeliveryDto } from './dto/cancel-delivery.dto';

@Injectable()
export class SchedulesService {
  constructor(
    @InjectRepository(ScheduledDelivery)
    private scheduledDeliveryRepository: Repository<ScheduledDelivery>,
    @InjectRepository(Agreement)
    private agreementsRepository: Repository<Agreement>,
  ) {}

  private async validateDateAndLimits(
    agreement: Agreement,
    targetDateStr: string,
    excludeDeliveryId?: string,
  ) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const targetDate = new Date(targetDateStr);
    targetDate.setHours(0, 0, 0, 0);

    if (targetDate < today) {
      throw new BadRequestException('No se puede programar en una fecha pasada.');
    }

    if (agreement.fechaFinEstimada) {
      const fechaFin = new Date(agreement.fechaFinEstimada);
      fechaFin.setHours(0, 0, 0, 0);
      if (targetDate > fechaFin) {
        throw new BadRequestException('La fecha programada excede la vigencia del convenio.');
      }
    }

    // Check duplicates
    const duplicateQuery = this.scheduledDeliveryRepository
      .createQueryBuilder('sd')
      .where('sd.id_convenio = :agreementId', { agreementId: agreement.id })
      .andWhere('sd.fecha_programada = :targetDate', { targetDate: targetDateStr })
      .andWhere('sd.estado IN (:...estados)', { estados: ['Programado', 'Reprogramado'] });

    if (excludeDeliveryId) {
      duplicateQuery.andWhere('sd.id_entrega != :excludeId', { excludeId: excludeDeliveryId });
    }

    const duplicate = await duplicateQuery.getOne();
    if (duplicate) {
      throw new BadRequestException('Ya existe una entrega programada para esta fecha en este convenio.');
    }

    // Check max retiros if it's a new scheduling or changing limits
    // Wait, if we are just rescheduling, we don't consume a NEW slot, we just move it.
    // So if excludeDeliveryId is provided, we don't need to check maxRetiros (as it's the same delivery).
    if (!excludeDeliveryId && agreement.tipoConvenio?.maxRetiros) {
      const activeDeliveriesCount = await this.scheduledDeliveryRepository
        .createQueryBuilder('sd')
        .where('sd.id_convenio = :agreementId', { agreementId: agreement.id })
        .andWhere('sd.estado IN (:...estados)', { estados: ['Programado', 'Reprogramado'] })
        .getCount();

      const occupiedSlots = (agreement.retirosRealizados || 0) + activeDeliveriesCount;
      if (occupiedSlots >= agreement.tipoConvenio.maxRetiros) {
        throw new BadRequestException('Se alcanzó el límite de retiros para este convenio.');
      }
    }
  }

  async create(createDto: CreateScheduledDeliveryDto) {
    const agreement = await this.agreementsRepository.findOne({
      where: { id: createDto.agreementId },
      relations: { tipoConvenio: true, organizacion: true },
    });

    if (!agreement) {
      throw new NotFoundException('Convenio no encontrado.');
    }

    if (agreement.estado !== 'Activo') {
      throw new BadRequestException('Solo se pueden programar entregas para convenios activos.');
    }

    await this.validateDateAndLimits(agreement, createDto.fechaProgramada);

    const delivery = new ScheduledDelivery();
    delivery.convenio = agreement;
    delivery.fechaProgramada = createDto.fechaProgramada as any;
    delivery.descripcion = createDto.descripcion as any;
    delivery.observaciones = createDto.observaciones as any;

    return this.scheduledDeliveryRepository.save(delivery);
  }

  async findAll(filters: {
    from?: string;
    to?: string;
    agreementId?: string;
    organizationId?: string;
    estado?: string;
  }) {
    const query = this.scheduledDeliveryRepository
      .createQueryBuilder('sd')
      .leftJoinAndSelect('sd.convenio', 'convenio')
      .leftJoinAndSelect('convenio.tipoConvenio', 'tipoConvenio')
      .leftJoinAndSelect('convenio.organizacion', 'organizacion');

    if (filters.from) {
      query.andWhere('sd.fecha_programada >= :from', { from: filters.from });
    }
    if (filters.to) {
      query.andWhere('sd.fecha_programada <= :to', { to: filters.to });
    }
    if (filters.agreementId) {
      query.andWhere('convenio.id_convenio = :agreementId', { agreementId: filters.agreementId });
    }
    if (filters.organizationId) {
      query.andWhere('organizacion.id_organizacion = :organizationId', { organizationId: filters.organizationId });
    }
    if (filters.estado) {
      const estados = filters.estado.split(',');
      query.andWhere('sd.estado IN (:...estados)', { estados });
    }

    query.orderBy('sd.fecha_programada', 'ASC');

    return query.getMany();
  }

  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Week boundaries (Monday to Sunday)
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const firstDayOfWeek = new Date(today.setDate(diff));
    firstDayOfWeek.setHours(0,0,0,0);
    const lastDayOfWeek = new Date(firstDayOfWeek);
    lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
    lastDayOfWeek.setHours(23,59,59,999);

    const firstDayStr = firstDayOfMonth.toISOString().split('T')[0];
    const lastDayStr = lastDayOfMonth.toISOString().split('T')[0];
    const firstWeekStr = firstDayOfWeek.toISOString().split('T')[0];
    const lastWeekStr = lastDayOfWeek.toISOString().split('T')[0];

    const programadasEsteMes = await this.scheduledDeliveryRepository
      .createQueryBuilder('sd')
      .where('sd.estado IN (:...estados)', { estados: ['Programado', 'Reprogramado'] })
      .andWhere('sd.fecha_programada >= :start AND sd.fecha_programada <= :end', { start: firstDayStr, end: lastDayStr })
      .getCount();

    const pendientesEstaSemana = await this.scheduledDeliveryRepository
      .createQueryBuilder('sd')
      .where('sd.estado IN (:...estados)', { estados: ['Programado', 'Reprogramado'] })
      .andWhere('sd.fecha_programada >= :start AND sd.fecha_programada <= :end', { start: firstWeekStr, end: lastWeekStr })
      .getCount();

    const canceladasEsteMes = await this.scheduledDeliveryRepository
      .createQueryBuilder('sd')
      .where('sd.estado = :estado', { estado: 'Cancelado' })
      .andWhere('sd.fecha_programada >= :start AND sd.fecha_programada <= :end', { start: firstDayStr, end: lastDayStr })
      .getCount();

    const conveniosActivos = await this.agreementsRepository.count({
      where: { estado: 'Activo' },
    });

    const todayStr = (new Date()).toISOString().split('T')[0];
    const date30Days = new Date();
    date30Days.setDate(date30Days.getDate() + 30);
    const date30Str = date30Days.toISOString().split('T')[0];

    const conveniosProximosAVencer = await this.agreementsRepository
      .createQueryBuilder('c')
      .where('c.estado = :estado', { estado: 'Activo' })
      .andWhere('c.fecha_fin_estimada IS NOT NULL')
      .andWhere('c.fecha_fin_estimada >= :start AND c.fecha_fin_estimada <= :end', { start: todayStr, end: date30Str })
      .getCount();

    // Convenios al límite de retiros: (retirosRealizados + programados) >= 80% maxRetiros
    const activeAgreementsWithMax = await this.agreementsRepository
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.tipoConvenio', 'tc')
      .where('c.estado = :estado', { estado: 'Activo' })
      .andWhere('tc.max_retiros IS NOT NULL')
      .getMany();

    let conveniosAlLimiteRetiros = 0;
    for (const agr of activeAgreementsWithMax) {
      const activeDeliveriesCount = await this.scheduledDeliveryRepository
        .createQueryBuilder('sd')
        .where('sd.id_convenio = :agrId', { agrId: agr.id })
        .andWhere('sd.estado IN (:...estados)', { estados: ['Programado', 'Reprogramado'] })
        .getCount();
      
      const occupied = (agr.retirosRealizados || 0) + activeDeliveriesCount;
      const max = agr.tipoConvenio.maxRetiros!;
      if (occupied >= max * 0.8) {
        conveniosAlLimiteRetiros++;
      }
    }

    return {
      programadasEsteMes,
      pendientesEstaSemana,
      canceladasEsteMes,
      conveniosActivos,
      conveniosProximosAVencer,
      conveniosAlLimiteRetiros
    };
  }

  async findOne(id: string) {
    const delivery = await this.scheduledDeliveryRepository.findOne({
      where: { id },
      relations: {
        convenio: {
          tipoConvenio: true,
          organizacion: true
        }
      }
    });

    if (!delivery) {
      throw new NotFoundException('Entrega programada no encontrada.');
    }

    return delivery;
  }

  async findByAgreement(agreementId: string) {
    return this.scheduledDeliveryRepository.find({
      where: { convenio: { id: agreementId } },
      relations: {
        convenio: {
          tipoConvenio: true,
          organizacion: true
        }
      },
      order: { fechaProgramada: 'ASC' }
    });
  }

  async update(id: string, updateDto: UpdateScheduledDeliveryDto) {
    const delivery = await this.findOne(id);

    if (delivery.estado === 'Cancelado') {
      throw new BadRequestException('No se puede editar una entrega cancelada.');
    }

    if (updateDto.descripcion !== undefined) {
      delivery.descripcion = updateDto.descripcion;
    }
    if (updateDto.observaciones !== undefined) {
      delivery.observaciones = updateDto.observaciones;
    }

    return this.scheduledDeliveryRepository.save(delivery);
  }

  async reschedule(id: string, rescheduleDto: RescheduleDeliveryDto) {
    const delivery = await this.findOne(id);

    if (delivery.estado !== 'Programado' && delivery.estado !== 'Reprogramado') {
      throw new BadRequestException('Solo se pueden reprogramar entregas en estado Programado o Reprogramado.');
    }

    await this.validateDateAndLimits(delivery.convenio, rescheduleDto.nuevaFecha, delivery.id);

    if (!delivery.fechaOriginal) {
      delivery.fechaOriginal = delivery.fechaProgramada;
    }

    delivery.fechaProgramada = rescheduleDto.nuevaFecha as any;
    delivery.motivoReprogramacion = rescheduleDto.motivoReprogramacion;
    delivery.estado = 'Reprogramado';

    return this.scheduledDeliveryRepository.save(delivery);
  }

  async cancel(id: string, cancelDto: CancelDeliveryDto) {
    const delivery = await this.findOne(id);

    if (delivery.estado !== 'Programado' && delivery.estado !== 'Reprogramado') {
      throw new BadRequestException('Solo se pueden cancelar entregas en estado Programado o Reprogramado.');
    }

    delivery.estado = 'Cancelado';
    delivery.motivoCancelacion = cancelDto.motivoCancelacion;

    return this.scheduledDeliveryRepository.save(delivery);
  }
}
