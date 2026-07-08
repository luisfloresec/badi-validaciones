import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { RealizedDelivery } from './entities/realized-delivery.entity';
import { CreateRealizedDeliveryDto } from './dto/create-realized-delivery.dto';
import { ScheduledDelivery } from '../schedules/entities/scheduled-delivery.entity';
import { Agreement } from '../agreements/entities/agreement.entity';
import { PdfGeneratorService, PdfImage } from '../reports/services/pdf-generator.service';
import { ExcelGeneratorService } from '../reports/services/excel-generator.service';
import { DocumentsService } from '../documents/documents.service';
import { EntityType } from '../documents/enums/entity-type.enum';
import { DocumentStatus } from '../documents/enums/document-status.enum';
import * as ExcelJS from 'exceljs';

@Injectable()
export class RealizedDeliveriesService {
  constructor(
    @InjectRepository(RealizedDelivery)
    private realizedDeliveryRepository: Repository<RealizedDelivery>,
    private dataSource: DataSource,
    private pdfGeneratorService: PdfGeneratorService,
    private excelGeneratorService: ExcelGeneratorService,
    private documentsService: DocumentsService,
  ) {}

  async create(createDto: CreateRealizedDeliveryDto): Promise<RealizedDelivery> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Obtener Entrega Programada con bloqueo para evitar concurrencia (solo tabla base)
      const scheduledDeliveryLocked = await queryRunner.manager
        .getRepository(ScheduledDelivery)
        .createQueryBuilder('sd')
        .where('sd.id = :id', { id: createDto.idEntregaProgramada })
        .setLock('pessimistic_write')
        .getOne();

      if (!scheduledDeliveryLocked) {
        throw new NotFoundException('La entrega programada no existe.');
      }

      // Validar estado de la entrega programada antes de continuar
      if (['Cancelado', 'Realizado'].includes(scheduledDeliveryLocked.estado)) {
        throw new BadRequestException(`No se puede registrar entrega porque su estado actual es ${scheduledDeliveryLocked.estado}.`);
      }

      // 2. Cargar la misma entrega con sus relaciones, SIN lock
      const scheduledDelivery = await queryRunner.manager.findOne(ScheduledDelivery, {
        where: { id: createDto.idEntregaProgramada },
        relations: { convenio: true, organizacion: true },
      });

      if (!scheduledDelivery || !scheduledDelivery.organizacion) {
        throw new BadRequestException('La entrega programada no tiene organización asociada.');
      }


      const agreement = scheduledDelivery.convenio ?? null;

      // Si hay convenio, cargar tipoConvenio y validar estado
      if (agreement) {
        const fullAgreement = await queryRunner.manager.findOne(Agreement, {
          where: { id: agreement.id },
          relations: { tipoConvenio: true },
        });
        if (fullAgreement) {
          // Copiar tipoConvenio al agreement en memoria
          agreement.tipoConvenio = fullAgreement.tipoConvenio;
        }
        if (agreement.estado !== 'Activo') {
          throw new BadRequestException('El convenio asociado no está activo.');
        }
      }

      // Evitar doble registro
      const existingDelivery = await queryRunner.manager.findOne(RealizedDelivery, {
        where: { entregaProgramada: { id: createDto.idEntregaProgramada } },
      });

      if (existingDelivery) {
        throw new BadRequestException('Ya existe un registro de entrega realizada para esta entrega programada.');
      }

      // Calcular kilos
      const cuota = createDto.cuota !== undefined && createDto.cuota !== null ? Number(createDto.cuota) : 0;
      const kilosEntregados = Number((cuota / 0.5).toFixed(2));

      const realizedDelivery = queryRunner.manager.create(RealizedDelivery, {
        entregaProgramada: scheduledDelivery,
        organizacion: scheduledDelivery.organizacion,
        convenio: agreement,
        fechaRealizacion: new Date(createDto.fechaRealizacion),
        cuota: cuota,
        kilosEntregados: kilosEntregados,
        personasAtendidas: Number(createDto.personasAtendidas || 0),
        beneficiariosAtendidos: createDto.beneficiariosAtendidos != null ? Number(createDto.beneficiariosAtendidos) : null,
        detalleProductos: createDto.detalleProductos ? String(createDto.detalleProductos) : null,
        observaciones: createDto.observaciones?.trim() || null,
      });

      const savedRealizedDelivery = await queryRunner.manager.save(realizedDelivery);

      // Cambiar estado de la entrega programada
      scheduledDelivery.estado = 'Realizado';
      await queryRunner.manager.save(scheduledDelivery);

      // Actualizar retiros del convenio si existe
      if (agreement) {
        agreement.retirosRealizados = (agreement.retirosRealizados || 0) + 1;
        if (agreement.tipoConvenio?.maxRetiros && agreement.retirosRealizados >= agreement.tipoConvenio.maxRetiros) {
          agreement.estado = 'Finalizado';
          agreement.fechaFinalizacion = new Date();
        }
        await queryRunner.manager.save(agreement);
      }

      // Commit Transaction
      await queryRunner.commitTransaction();

      return savedRealizedDelivery;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      if (err instanceof BadRequestException || err instanceof NotFoundException) {
        throw err;
      }
      console.error('[RealizedDeliveriesService.create] Error inesperado:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      throw new InternalServerErrorException(`Error interno al guardar la entrega realizada: ${errorMessage}`);
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(): Promise<RealizedDelivery[]> {
    return this.realizedDeliveryRepository.find({
      relations: { organizacion: true, entregaProgramada: true, convenio: { organizacion: true } },
      order: { fechaRealizacion: 'DESC' },
    });
  }

  async findOne(id: string): Promise<RealizedDelivery> {
    const delivery = await this.realizedDeliveryRepository.findOne({
      where: { id },
      relations: { organizacion: true, entregaProgramada: true, convenio: { organizacion: true } },
    });

    if (!delivery) {
      throw new NotFoundException(`Entrega realizada con ID ${id} no encontrada`);
    }

    return delivery;
  }

  async findByAgreement(agreementId: string): Promise<RealizedDelivery[]> {
    return this.realizedDeliveryRepository.find({
      where: { convenio: { id: agreementId } },
      relations: { organizacion: true, entregaProgramada: true, convenio: { organizacion: true } },
      order: { fechaRealizacion: 'DESC' },
    });
  }

  async findByOrganization(organizationId: string): Promise<RealizedDelivery[]> {
    return this.realizedDeliveryRepository.find({
      where: [
        { convenio: { organizacion: { id: organizationId } } },
        { organizacion: { id: organizationId } }
      ],
      relations: { organizacion: true, entregaProgramada: true, convenio: { organizacion: true } },
      order: { fechaRealizacion: 'DESC' },
    });
  }

  async findBySchedule(scheduleId: string): Promise<RealizedDelivery | null> {
    const delivery = await this.realizedDeliveryRepository.findOne({
      where: { entregaProgramada: { id: scheduleId } },
    });
    return delivery;
  }

  async generateReport(id: string): Promise<PDFKit.PDFDocument> {
    const delivery = await this.findOne(id);
    const convenio = delivery.convenio;
    const organizacion = delivery.organizacion;

    // Buscar evidencias
    const docs = await this.documentsService.findAll({
      entregaId: id,
      estado: DocumentStatus.ACTIVO,
      limit: 100
    } as any);
    
    // Filtrar solo imágenes
    const evidencias = docs.data.filter(d => ['png', 'jpg', 'jpeg'].includes(d.extension));

    // 1. Crear documento
    const doc = this.pdfGeneratorService.createDocument({
      title: 'Reporte de Entrega',
    });

    // 2. Encabezado institucional
    this.pdfGeneratorService.drawHeader(doc, {
      title: 'Reporte de Entrega'
    });

    // 3. Info del reporte (caja superior)
    const splitId = delivery.id.split('-');
    const reportNum = splitId[0].toUpperCase() + '-' + (splitId[1] || '0000');
    
    this.pdfGeneratorService.drawReportInfo(doc, {
      numeroReporte: reportNum,
      fechaEjecucion: delivery.fechaRealizacion?.toString(),
      fechaGeneracion: new Date().toLocaleDateString('es-EC'),
      usuario: 'Sistema BADI'
    });

    // 4. Información General
    this.pdfGeneratorService.drawSectionTitle(doc, 'Información General');
    
    this.pdfGeneratorService.drawInstitutionalCard(doc, [
      { label: 'Organización', value: organizacion?.razonSocial || organizacion?.nombreComercial || 'Desconocida' },
      { label: 'Responsable', value: 'No registrado' },
      { label: 'Estado', value: delivery.estado },
      { label: 'Convenio Asociado', value: convenio?.codigoConvenio || 'Sin convenio' },
      { label: 'Beneficiarios Directos', value: delivery.beneficiariosAtendidos !== null && delivery.beneficiariosAtendidos !== undefined ? delivery.beneficiariosAtendidos.toString() : 'No especificado' }
    ]);

    // 5. Productos Entregados (Tabla)
    this.pdfGeneratorService.drawSectionTitle(doc, 'Productos Entregados');
    
    const headers = ['Producto', 'Cantidad', 'Unidad', 'Observaciones'];
    // Aquí mapeamos el string detalleProductos a una fila única porque no está normalizado.
    // En un futuro, si es JSON o relación, se generarán múltiples filas.
    const rows = [
      ['Variados', `${delivery.kilosEntregados}`, 'kg', delivery.detalleProductos || 'Sin detalle'],
      ['Total de personas atendidas', `${delivery.personasAtendidas}`, 'personas', '']
    ];
    
    const colWidths = [120, 80, 80, 215]; // Suman 495 (aprox ancho página - márgenes)
    this.pdfGeneratorService.drawTable(doc, headers, rows, colWidths);

    // 6. Observaciones
    if (delivery.observaciones) {
      this.pdfGeneratorService.drawSectionTitle(doc, 'Observaciones');
      this.pdfGeneratorService.drawLongText(doc, delivery.observaciones);
    }

    // 7. Evidencias Fotográficas
    this.pdfGeneratorService.drawSectionTitle(doc, 'Evidencias Fotográficas');
    
    const imageList: PdfImage[] = [];
    let imgCounter = 1;

    for (const evidencia of evidencias) {
      try {
        const streamData = await this.documentsService.getDownloadStream(evidencia.id);
        const chunks: Buffer[] = [];
        for await (const chunk of streamData.stream) {
          chunks.push(Buffer.from(chunk));
        }
        imageList.push({
          buffer: Buffer.concat(chunks),
          caption: `Evidencia ${imgCounter}`
        });
        imgCounter++;
      } catch (error) {
        console.error(`Error procesando imagen ${evidencia.id}:`, error);
      }
    }

    this.pdfGeneratorService.drawGallery(doc, imageList);

    // 8. Finalizar Documento
    this.pdfGeneratorService.finalizeDocument(doc);
    return doc;
  }

  async exportToExcel(searchTerm?: string, estado?: string): Promise<ExcelJS.Workbook> {
    let deliveries = await this.findAll();

    if (estado && estado !== 'TODOS') {
      deliveries = deliveries.filter(d => d.estado === estado);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase().trim();
      deliveries = deliveries.filter(d => {
        const orgName = d.organizacion?.razonSocial?.toLowerCase() || d.convenio?.organizacion?.razonSocial?.toLowerCase() || '';
        const orgComercial = d.organizacion?.nombreComercial?.toLowerCase() || d.convenio?.organizacion?.nombreComercial?.toLowerCase() || '';
        const convCode = d.convenio?.codigoConvenio?.toLowerCase() || '';
        return orgName.includes(term) || orgComercial.includes(term) || convCode.includes(term);
      });
    }

    const data = deliveries.map(d => ({
      id: d.id.split('-')[0].toUpperCase(),
      fecha: d.fechaRealizacion ? new Date(d.fechaRealizacion) : null,
      convenio: d.convenio?.codigoConvenio || 'Sin convenio',
      organizacion: d.organizacion?.razonSocial || d.organizacion?.nombreComercial || d.convenio?.organizacion?.razonSocial || '—',
      estado: d.estado,
      kilos: Number(d.kilosEntregados) || 0,
      personas: Number(d.personasAtendidas) || 0
    }));

    return this.excelGeneratorService.generateExcel({
      title: 'Listado de Entregas Realizadas',
      sheetName: 'Entregas',
      columns: [
        { header: 'ID Entrega', key: 'id', width: 15 },
        { header: 'Fecha Realización', key: 'fecha', width: 20 },
        { header: 'Convenio', key: 'convenio', width: 20 },
        { header: 'Organización', key: 'organizacion', width: 45 },
        { header: 'Estado', key: 'estado', width: 15 },
        { header: 'Kilos Entregados', key: 'kilos', width: 20 },
        { header: 'Personas Atendidas', key: 'personas', width: 20 }
      ],
      data,
      summaryRow: {
        id: 'TOTALES',
        kilos: data.reduce((acc, curr) => acc + curr.kilos, 0),
        personas: data.reduce((acc, curr) => acc + curr.personas, 0)
      }
    });
  }
}
