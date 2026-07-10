import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, Not } from 'typeorm';
import { ScheduledDelivery } from './entities/scheduled-delivery.entity';
import { Agreement } from '../agreements/entities/agreement.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { CreateScheduledDeliveryDto } from './dto/create-scheduled-delivery.dto';
import { UpdateScheduledDeliveryDto } from './dto/update-scheduled-delivery.dto';
import { RescheduleDeliveryDto } from './dto/reschedule-delivery.dto';
import { CancelDeliveryDto } from './dto/cancel-delivery.dto';
import { RealizedDelivery } from '../realized-deliveries/entities/realized-delivery.entity';
import { ExcelGeneratorService } from '../reports/services/excel-generator.service';
import * as ExcelJS from 'exceljs';

@Injectable()
export class SchedulesService {
  constructor(
    @InjectRepository(ScheduledDelivery)
    private scheduledDeliveryRepository: Repository<ScheduledDelivery>,
    @InjectRepository(Agreement)
    private agreementsRepository: Repository<Agreement>,
    @InjectRepository(Organization)
    private organizationsRepository: Repository<Organization>,
    @InjectRepository(RealizedDelivery)
    private realizedDeliveryRepository: Repository<RealizedDelivery>,
    private excelGeneratorService: ExcelGeneratorService,
  ) {}

  private normalizeDateOnly(value: string | Date): string {
    if (value instanceof Date) {
      const year = value.getFullYear();
      const month = String(value.getMonth() + 1).padStart(2, '0');
      const day = String(value.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    return String(value).slice(0, 10);
  }

  private async validateDateAndLimits(
    targetDateInput: string | Date,
    organization: Organization,
    agreement?: Agreement,
    excludeDeliveryId?: string,
  ) {
    const targetDateStr = this.normalizeDateOnly(targetDateInput);
    const todayStr = this.normalizeDateOnly(new Date());

    if (targetDateStr < todayStr) {
      throw new BadRequestException('No se puede programar en una fecha pasada.');
    }

    if (agreement) {
      if (agreement.fechaFinEstimada) {
        const fechaFinStr = this.normalizeDateOnly(agreement.fechaFinEstimada as any);
        if (targetDateStr > fechaFinStr) {
          throw new BadRequestException('La fecha programada excede la vigencia del convenio.');
        }
      }

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
  }

  async create(createDto: CreateScheduledDeliveryDto) {
    const organization = await this.organizationsRepository.findOne({
      where: { id: createDto.organizationId }
    });

    if (!organization) {
      throw new NotFoundException('Organización no encontrada.');
    }

    let agreement: Agreement | undefined;
    if (createDto.agreementId) {
      const foundAgreement = await this.agreementsRepository.findOne({
        where: { id: createDto.agreementId },
        relations: { tipoConvenio: true, organizacion: true },
      });

      if (!foundAgreement) {
        throw new NotFoundException('Convenio no encontrado.');
      }

      if (foundAgreement.organizacion.id !== organization.id) {
        throw new BadRequestException('El convenio no pertenece a la organización seleccionada.');
      }

      if (foundAgreement.estado !== 'Activo') {
        throw new BadRequestException('Solo se pueden programar entregas para convenios activos.');
      }
      agreement = foundAgreement;
    }

    const targetDateStr = this.normalizeDateOnly(createDto.fechaProgramada);
    await this.validateDateAndLimits(targetDateStr, organization, agreement);

    const delivery = new ScheduledDelivery();
    delivery.organizacion = organization;
    if (agreement) {
      delivery.convenio = agreement;
    }
    
    delivery.fechaProgramada = targetDateStr as any;
    delivery.horaProgramada = createDto.horaProgramada;
    


    if (createDto.estadoSeguimiento) {
      delivery.estadoSeguimiento = createDto.estadoSeguimiento;
    }

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
      .leftJoinAndSelect('sd.organizacion', 'organizacionDirecta')
      .leftJoinAndSelect('organizacionDirecta.segmento', 'segmentoDirecto')
      .leftJoinAndSelect('sd.convenio', 'convenio')
      .leftJoinAndSelect('convenio.tipoConvenio', 'tipoConvenio')
      .leftJoinAndSelect('convenio.organizacion', 'organizacion')
      .leftJoinAndSelect('organizacion.segmento', 'segmentoConvenio');

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
      query.andWhere(
        '(organizacion.id_organizacion = :organizationId OR organizacionDirecta.id_organizacion = :organizationId)', 
        { organizationId: filters.organizationId }
      );
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
        organizacion: true,
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
        organizacion: true,
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
      if (updateDto.descripcion !== undefined || updateDto.observaciones !== undefined) {
        throw new BadRequestException('No se puede editar los detalles principales de una entrega cancelada.');
      }
    }

    if (updateDto.descripcion !== undefined) {
      delivery.descripcion = updateDto.descripcion;
    }
    if (updateDto.observaciones !== undefined) {
      delivery.observaciones = updateDto.observaciones;
    }
    if (updateDto.estadoSeguimiento !== undefined) {
      delivery.estadoSeguimiento = updateDto.estadoSeguimiento;
    }
    if (updateDto.horaProgramada !== undefined) {
      delivery.horaProgramada = updateDto.horaProgramada;
    }
    if (updateDto.cuota !== undefined) {
      delivery.cuota = updateDto.cuota;
    }
    if (updateDto.kilosEstimados !== undefined) {
      delivery.kilosEstimados = updateDto.kilosEstimados;
    }


    return this.scheduledDeliveryRepository.save(delivery);
  }

  async reschedule(id: string, rescheduleDto: RescheduleDeliveryDto) {
    const delivery = await this.findOne(id);

    if (delivery.estado !== 'Programado' && delivery.estado !== 'Reprogramado') {
      throw new BadRequestException('Solo se pueden reprogramar entregas en estado Programado o Reprogramado.');
    }

    const targetDateStr = this.normalizeDateOnly(rescheduleDto.nuevaFecha);
    await this.validateDateAndLimits(targetDateStr, delivery.organizacion, delivery.convenio, delivery.id);

    if (!delivery.fechaOriginal) {
      delivery.fechaOriginal = delivery.fechaProgramada;
    }

    delivery.fechaProgramada = targetDateStr as any;
    delivery.horaProgramada = rescheduleDto.nuevaHora;
    delivery.motivoReprogramacion = rescheduleDto.motivoReprogramacion?.trim() || 'Reprogramación sin motivo registrado';
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

  async exportBoardExcel(filters: {
    from?: string;
    to?: string;
    agreementId?: string;
    organizationId?: string;
    estado?: string;
  }): Promise<ExcelJS.Workbook> {
    const schedules = await this.findAll(filters);
    
    // Filter out Cancelados as per rules
    const validSchedules = schedules.filter(sd => sd.estado !== 'Cancelado');
    if (validSchedules.length === 0) {
      return this.excelGeneratorService.generateExcel({
        title: 'Tablero Operativo - Sin Registros',
        sheetName: 'Tablero',
        columns: [{ header: 'Mensaje', key: 'mensaje', width: 50 }],
        data: [{ mensaje: 'No hay entregas para las fechas seleccionadas' }]
      });
    }

    const scheduleIds = validSchedules.map(sd => sd.id);
    const realizedDeliveries = await this.realizedDeliveryRepository.find({
      where: { entregaProgramada: { id: In(scheduleIds) } },
      relations: {
        entregaProgramada: true
      }
    });

    const rdMap = new Map<string, RealizedDelivery>();
    for (const rd of realizedDeliveries) {
      rdMap.set(rd.entregaProgramada.id, rd);
    }

    // Group by Date and Week for Totals
    const data: any[] = [];
    let currentTotalCuota = 0;
    let currentTotalKilos = 0;
    let currentTotalUsuarios = 0;
    
    let weekTotalCuota = 0;
    let weekTotalKilos = 0;
    let weekTotalUsuarios = 0;
    
    let lastDate = '';
    let lastWeekMonday = '';
    let lastWeekSunday = '';

    const getMonday = (dateStr: string) => {
      const d = new Date(dateStr + 'T12:00:00');
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d.setDate(diff));
      return monday.toISOString().slice(0, 10);
    };
    const getSunday = (mondayStr: string) => {
      const d = new Date(mondayStr + 'T12:00:00');
      const sunday = new Date(d.setDate(d.getDate() + 6));
      return sunday.toISOString().slice(0, 10);
    };

    for (let i = 0; i < validSchedules.length; i++) {
      const sd = validSchedules[i];
      const dateStr = this.normalizeDateOnly(sd.fechaProgramada);
      const currentMonday = getMonday(dateStr);
      
      if (lastDate && lastDate !== dateStr) {
        // Push totals row for lastDate
        data.push({
          fechaProgramada: 'TOTAL DEL DÍA',
          organizacion: '',
          segmento: '',
          convenio: '',
          horaProgramada: '',
          cuota: currentTotalCuota,
          kilos: currentTotalKilos,
          usuarios: currentTotalUsuarios,
          estadoSeguimiento: '',
          descripcion: '',
          estado: ''
        });
        currentTotalCuota = 0;
        currentTotalKilos = 0;
        currentTotalUsuarios = 0;
      }
      
      if (lastWeekMonday && lastWeekMonday !== currentMonday) {
        // Push totals row for lastWeek
        data.push({
          fechaProgramada: `TOTAL SEMANAL ${lastWeekMonday.split('-').reverse().join('/')} - ${lastWeekSunday.split('-').reverse().join('/')}`,
          organizacion: '',
          segmento: '',
          convenio: '',
          horaProgramada: '',
          cuota: weekTotalCuota,
          kilos: weekTotalKilos,
          usuarios: weekTotalUsuarios,
          estadoSeguimiento: '',
          descripcion: '',
          estado: ''
        });
        weekTotalCuota = 0;
        weekTotalKilos = 0;
        weekTotalUsuarios = 0;
      }
      
      lastDate = dateStr;
      lastWeekMonday = currentMonday;
      lastWeekSunday = getSunday(currentMonday);

      const rd = rdMap.get(sd.id);
      
      const cuotaNum = rd && rd.cuota != null ? Number(rd.cuota) : (sd.cuota != null ? Number(sd.cuota) : 0);
      let kilosNum = 0;
      if (rd && rd.kilosEntregados != null) {
        kilosNum = Number(rd.kilosEntregados);
      } else if (sd.kilosEstimados != null) {
        kilosNum = Number(sd.kilosEstimados);
      } else if (cuotaNum > 0) {
        kilosNum = cuotaNum / 0.5;
      }

      const usuariosNum = rd && rd.personasAtendidas != null ? Number(rd.personasAtendidas) : 0;

      currentTotalCuota += cuotaNum;
      currentTotalKilos += kilosNum;
      currentTotalUsuarios += usuariosNum;
      weekTotalCuota += cuotaNum;
      weekTotalKilos += kilosNum;
      weekTotalUsuarios += usuariosNum;

      data.push({
        fechaProgramada: dateStr,
        organizacion: sd.organizacion?.razonSocial || sd.organizacion?.nombreComercial || '—',
        segmento: sd.organizacion?.segmento?.nombre || sd.organizacion?.segmento?.descripcion || '—',
        convenio: sd.convenio?.codigoConvenio || '—',
        horaProgramada: sd.horaProgramada,
        cuota: cuotaNum,
        kilos: kilosNum,
        usuarios: usuariosNum,
        estadoSeguimiento: sd.estadoSeguimiento,
        descripcion: sd.descripcion || '',
        estado: sd.estado
      });
    }

    if (lastDate) {
      data.push({
        fechaProgramada: 'TOTAL DEL DÍA',
        organizacion: '',
        segmento: '',
        convenio: '',
        horaProgramada: '',
        cuota: currentTotalCuota,
        kilos: currentTotalKilos,
        usuarios: currentTotalUsuarios,
        estadoSeguimiento: '',
        descripcion: '',
        estado: ''
      });
      data.push({
        fechaProgramada: `TOTAL SEMANAL ${lastWeekMonday.split('-').reverse().join('/')} - ${lastWeekSunday.split('-').reverse().join('/')}`,
        organizacion: '',
        segmento: '',
        convenio: '',
        horaProgramada: '',
        cuota: weekTotalCuota,
        kilos: weekTotalKilos,
        usuarios: weekTotalUsuarios,
        estadoSeguimiento: '',
        descripcion: '',
        estado: ''
      });
    }

    return this.excelGeneratorService.generateExcel({
      title: 'Tablero Operativo BADI',
      sheetName: 'Tablero Operativo',
      columns: [
        { header: 'Fecha', key: 'fechaProgramada', width: 15 },
        { header: 'Organización', key: 'organizacion', width: 45 },
        { header: 'Segmento', key: 'segmento', width: 20 },
        { header: 'Convenio', key: 'convenio', width: 15 },
        { header: 'Hora', key: 'horaProgramada', width: 10 },
        { header: 'Cuota', key: 'cuota', width: 10 },
        { header: 'Kilos', key: 'kilos', width: 10 },
        { header: 'Usuarios', key: 'usuarios', width: 10 },
        { header: 'Seguimiento', key: 'estadoSeguimiento', width: 15 },
        { header: 'Descripción', key: 'descripcion', width: 30 },
        { header: 'Estado', key: 'estado', width: 15 }
      ],
      data
    });
  }
}
