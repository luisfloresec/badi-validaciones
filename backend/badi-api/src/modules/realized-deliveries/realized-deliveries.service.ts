import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { RealizedDelivery } from './entities/realized-delivery.entity';
import { CreateRealizedDeliveryDto } from './dto/create-realized-delivery.dto';
import { ScheduledDelivery } from '../schedules/entities/scheduled-delivery.entity';
import { Agreement } from '../agreements/entities/agreement.entity';

@Injectable()
export class RealizedDeliveriesService {
  constructor(
    @InjectRepository(RealizedDelivery)
    private realizedDeliveryRepository: Repository<RealizedDelivery>,
    private dataSource: DataSource,
  ) {}

  async create(createDto: CreateRealizedDeliveryDto): Promise<RealizedDelivery> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Obtener Entrega Programada con bloqueo para evitar concurrencia
      const scheduledDelivery = await queryRunner.manager.findOne(ScheduledDelivery, {
        where: { id: createDto.idEntregaProgramada },
        relations: { convenio: { tipoConvenio: true } },
        lock: { mode: 'pessimistic_write' },
      });

      if (!scheduledDelivery) {
        throw new NotFoundException('La entrega programada no existe.');
      }

      // Validar estado de la entrega programada
      if (['Cancelado', 'Realizado'].includes(scheduledDelivery.estado)) {
        throw new BadRequestException(`No se puede registrar entrega porque su estado actual es ${scheduledDelivery.estado}.`);
      }

      const agreement = scheduledDelivery.convenio;
      if (!agreement || agreement.estado !== 'Activo') {
        throw new BadRequestException('El convenio asociado no existe o no está activo.');
      }

      // Evitar doble registro validando si ya existe una entrega realizada para este cronograma
      const existingDelivery = await queryRunner.manager.findOne(RealizedDelivery, {
        where: { entregaProgramada: { id: createDto.idEntregaProgramada } },
      });

      if (existingDelivery) {
        throw new BadRequestException('Ya existe un registro de entrega realizada para esta entrega programada.');
      }

      // 2. Crear Entrega Realizada
      const realizedDelivery = queryRunner.manager.create(RealizedDelivery, {
        entregaProgramada: scheduledDelivery,
        convenio: agreement,
        fechaRealizacion: createDto.fechaRealizacion as any,
        kilosEntregados: createDto.kilosEntregados,
        personasAtendidas: createDto.personasAtendidas,
        beneficiariosAtendidos: createDto.beneficiariosAtendidos,
        detalleProductos: createDto.detalleProductos,
        observaciones: createDto.observaciones,
      });

      const savedRealizedDelivery = await queryRunner.manager.save(realizedDelivery);

      // 3. Cambiar estado de la entrega programada
      scheduledDelivery.estado = 'Realizado';
      await queryRunner.manager.save(scheduledDelivery);

      // 4. Incrementar retirosRealizados del convenio y evaluar finalización
      agreement.retirosRealizados += 1;

      if (agreement.tipoConvenio.maxRetiros && agreement.retirosRealizados >= agreement.tipoConvenio.maxRetiros) {
        agreement.estado = 'Finalizado';
        agreement.fechaFinalizacion = new Date();
      }

      await queryRunner.manager.save(agreement);

      // Commit Transaction
      await queryRunner.commitTransaction();

      return savedRealizedDelivery;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      if (err instanceof BadRequestException || err instanceof NotFoundException) {
        throw err;
      }
      throw new InternalServerErrorException('Error interno al guardar la entrega realizada');
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(): Promise<RealizedDelivery[]> {
    return this.realizedDeliveryRepository.find({
      relations: { entregaProgramada: true, convenio: { organizacion: true } },
      order: { fechaRealizacion: 'DESC' },
    });
  }

  async findOne(id: string): Promise<RealizedDelivery> {
    const delivery = await this.realizedDeliveryRepository.findOne({
      where: { id },
      relations: { entregaProgramada: true, convenio: { organizacion: true } },
    });

    if (!delivery) {
      throw new NotFoundException(`Entrega realizada con ID ${id} no encontrada`);
    }

    return delivery;
  }

  async findByAgreement(agreementId: string): Promise<RealizedDelivery[]> {
    return this.realizedDeliveryRepository.find({
      where: { convenio: { id: agreementId } },
      relations: { entregaProgramada: true, convenio: { organizacion: true } },
      order: { fechaRealizacion: 'DESC' },
    });
  }

  async findByOrganization(organizationId: string): Promise<RealizedDelivery[]> {
    return this.realizedDeliveryRepository.find({
      where: { convenio: { organizacion: { id: organizationId } } },
      relations: { entregaProgramada: true, convenio: { organizacion: true } },
      order: { fechaRealizacion: 'DESC' },
    });
  }

  async findBySchedule(scheduleId: string): Promise<RealizedDelivery | null> {
    const delivery = await this.realizedDeliveryRepository.findOne({
      where: { entregaProgramada: { id: scheduleId } },
    });
    if (!delivery) {
      throw new NotFoundException(`No se encontró entrega realizada para el cronograma ${scheduleId}`);
    }
    return delivery;
  }
}
