import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThan, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Organization } from '../organizations/entities/organization.entity';
import { Agreement } from '../agreements/entities/agreement.entity';
import { ScheduledDelivery } from '../schedules/entities/scheduled-delivery.entity';
import { RealizedDelivery } from '../realized-deliveries/entities/realized-delivery.entity';
import { Document } from '../documents/entities/document.entity';
import { User } from '../users/entities/user.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { EntityType } from '../documents/enums/entity-type.enum';
import { DocumentStatus } from '../documents/enums/document-status.enum';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @InjectRepository(Organization)
    private readonly organizationRepo: Repository<Organization>,
    @InjectRepository(Agreement)
    private readonly agreementRepo: Repository<Agreement>,
    @InjectRepository(ScheduledDelivery)
    private readonly scheduledDeliveryRepo: Repository<ScheduledDelivery>,
    @InjectRepository(RealizedDelivery)
    private readonly realizedDeliveryRepo: Repository<RealizedDelivery>,
    @InjectRepository(Document)
    private readonly documentRepo: Repository<Document>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepo: Repository<AuditLog>,
  ) {}

  async getSummary() {
    // 1. Manejo preciso de fechas locales sin desfase
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hoyStr = `${year}-${month}-${day}`;
    const inicioMesStr = `${year}-${month}-01`;
    
    // Calcular fin de mes
    const finMesDate = new Date(year, now.getMonth() + 1, 0);
    const finMesDay = String(finMesDate.getDate()).padStart(2, '0');
    const finMesStr = `${year}-${month}-${finMesDay}`;

    // Fecha límite para convenios por vencer (30 días en el futuro)
    const fechaVencer = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const vYear = fechaVencer.getFullYear();
    const vMonth = String(fechaVencer.getMonth() + 1).padStart(2, '0');
    const vDay = String(fechaVencer.getDate()).padStart(2, '0');
    const fechaVencerStr = `${vYear}-${vMonth}-${vDay}`;

    // --- Consultas eficientes (en paralelo para máximo rendimiento) ---
    const [
      organizacionesActivas,
      conveniosActivos,
      entregasProgramadasMes,
      entregasRealizadasMes,
      kilosEntregadosMesRaw,
      documentosActivos,
      usuariosActivos,
      conveniosRegistrados,
      conveniosFinalizados,
      conveniosAnulados,
      conveniosPorVencerRaw,
      programadasHoyRaw,
      proximasEntregasRaw,
      reprogramadasCount,
      canceladasMesCount,
      ultimasEntregasRaw,
      documentosTotal,
      documentosAnulados,
      documentosPorTipoRaw,
      ultimosDocumentosRaw,
      actividadRecienteRaw,
      orgSinConvenioCount,
      entregasPendientesCount,
    ] = await Promise.all([
      // Resumen general
      this.organizationRepo.count({ where: [{ estado: 'Activa' }, { estado: 'Activo' }] }),
      this.agreementRepo.count({ where: { estado: 'Activo' } }),
      this.scheduledDeliveryRepo.createQueryBuilder('s')
        .where('s.fechaProgramada >= :inicioMes', { inicioMes: inicioMesStr })
        .andWhere('s.fechaProgramada <= :finMes', { finMes: finMesStr })
        .getCount(),
      this.realizedDeliveryRepo.createQueryBuilder('r')
        .where('r.fechaRealizacion >= :inicioMes', { inicioMes: inicioMesStr })
        .andWhere('r.fechaRealizacion <= :finMes', { finMes: finMesStr })
        .andWhere('r.estado != :estado', { estado: 'Anulada' })
        .getCount(),
      this.realizedDeliveryRepo.createQueryBuilder('r')
        .where('r.fechaRealizacion >= :inicioMes', { inicioMes: inicioMesStr })
        .andWhere('r.fechaRealizacion <= :finMes', { finMes: finMesStr })
        .andWhere('r.estado != :estado', { estado: 'Anulada' })
        .select('SUM(r.kilosEntregados)', 'sum')
        .getRawOne(),
      this.documentRepo.count({ where: { estado: DocumentStatus.ACTIVO } }),
      this.userRepo.count({ where: { estado: 'Activo' } }),

      // Convenios
      this.agreementRepo.count({ where: { estado: 'Registrado' } }),
      this.agreementRepo.count({ where: { estado: 'Finalizado' } }),
      this.agreementRepo.count({ where: { estado: 'Anulado' } }),
      this.agreementRepo.find({
        where: { estado: 'Activo', fechaFinEstimada: LessThanOrEqual(fechaVencerStr as any) },
        relations: { organizacion: true, tipoConvenio: true },
        order: { fechaFinEstimada: 'ASC' },
        take: 5,
      }),

      // Cronograma
      this.scheduledDeliveryRepo.find({
        where: { fechaProgramada: hoyStr as any, estado: In(['Programado', 'Pendiente', 'Reprogramado']) },
        relations: { convenio: { organizacion: true } },
        order: { fechaProgramada: 'ASC' },
      }),
      this.scheduledDeliveryRepo.find({
        where: { fechaProgramada: MoreThanOrEqual(hoyStr as any), estado: In(['Programado', 'Pendiente', 'Reprogramado']) },
        relations: { convenio: { organizacion: true } },
        order: { fechaProgramada: 'ASC' },
        take: 5,
      }),
      this.scheduledDeliveryRepo.count({ where: { estado: 'Reprogramado' } }),
      this.scheduledDeliveryRepo.createQueryBuilder('s')
        .where('s.fechaProgramada >= :inicioMes', { inicioMes: inicioMesStr })
        .andWhere('s.fechaProgramada <= :finMes', { finMes: finMesStr })
        .andWhere('s.estado = :estado', { estado: 'Cancelada' })
        .getCount(),

      // Entregas Realizadas
      this.realizedDeliveryRepo.find({
        relations: { convenio: { organizacion: true } },
        order: { fechaRealizacion: 'DESC' },
        take: 5,
      }),

      // Documentos
      this.documentRepo.count(),
      this.documentRepo.count({ where: { estado: DocumentStatus.ANULADO } }),
      this.documentRepo.createQueryBuilder('doc')
        .leftJoin('doc.tipoDocumento', 'tipo')
        .select('tipo.nombre', 'tipo')
        .addSelect('COUNT(*)', 'count')
        .groupBy('tipo.id')
        .getRawMany(),
      this.documentRepo.find({
        relations: { tipoDocumento: true },
        order: { fechaCarga: 'DESC' },
        take: 5,
      }),

      // Auditoría
      this.auditLogRepo.find({
        relations: { user: true },
        order: { fechaHora: 'DESC' },
        take: 6,
      }),

      // Alertas
      this.organizationRepo.createQueryBuilder('org')
        .leftJoin('org.convenios', 'conv')
        .where('conv.id IS NULL')
        .andWhere('org.estado IN (:...estados)', { estados: ['Activa', 'Activo', 'Registrada'] })
        .getCount(),
      this.scheduledDeliveryRepo.count({
        where: { fechaProgramada: LessThan(hoyStr as any), estado: In(['Programado', 'Pendiente', 'Reprogramado']) },
      }),
    ]);

    const kilosEntregadosMes = parseFloat(kilosEntregadosMesRaw?.sum || '0');

    // Enriquecer nombres de entidades para documentos recientes
    const ultimosDocumentos = await Promise.all(
      ultimosDocumentosRaw.map(async (doc) => {
        let entityName = '';
        if (doc.entidadRelacionada === EntityType.ORGANIZACION && doc.idEntidadRelacionada) {
          const org = await this.organizationRepo.findOne({ where: { id: doc.idEntidadRelacionada } });
          if (org) entityName = org.razonSocial;
        } else if (doc.entidadRelacionada === EntityType.CONVENIO && doc.idEntidadRelacionada) {
          const conv = await this.agreementRepo.findOne({
            where: { id: doc.idEntidadRelacionada },
            relations: { organizacion: true },
          });
          if (conv) {
            const codigo = conv.codigoConvenio || 'S/N';
            const organizacion = conv.organizacion?.razonSocial || conv.organizacion?.nombreComercial || 'Organización no especificada';
            entityName = `Convenio ${codigo} - ${organizacion}`;
          }
        } else if (doc.entidadRelacionada === EntityType.ENTREGA_REALIZADA && doc.idEntidadRelacionada) {
          entityName = `Entrega (${doc.idEntidadRelacionada.slice(0, 8)})`;
        } else {
          entityName = 'Repositorio Global';
        }
        return { ...doc, entityName };
      }),
    );

    // Mapear Convenios por Estado para gráfico/resumen
    const conveniosPorEstado = [
      { estado: 'Registrado', count: conveniosRegistrados, color: '#3b82f6' },
      { estado: 'Activo', count: conveniosActivos, color: '#10b981' },
      { estado: 'Finalizado', count: conveniosFinalizados, color: '#6b7280' },
      { estado: 'Anulado', count: conveniosAnulados, color: '#ef4444' },
    ];

    // Mapear Documentos por Tipo
    const documentosPorTipo = documentosPorTipoRaw.map((item) => ({
      tipo: item.tipo || 'Sin Tipo',
      count: parseInt(item.count, 10),
    }));

    // Alertas dinámicas
    const alertas = [
      { icon: 'apartment', label: 'Organizaciones sin convenio registrado', count: orgSinConvenioCount, link: '/organizations' },
      { icon: 'description', label: 'Convenios en estado Registrado (pendientes de activación)', count: conveniosRegistrados, link: '/agreements' },
      { icon: 'pending_actions', label: 'Entregas programadas vencidas sin confirmar', count: entregasPendientesCount, link: '/schedules' },
      { icon: 'event_busy', label: 'Entregas canceladas este mes', count: canceladasMesCount, link: '/schedules' },
    ];

    return {
      resumen: {
        organizacionesActivas,
        conveniosActivos,
        entregasProgramadasMes,
        entregasRealizadasMes,
        kilosEntregadosMes,
        documentosActivos,
        usuariosActivos,
      },
      convenios: {
        registrados: conveniosRegistrados,
        activos: conveniosActivos,
        finalizados: conveniosFinalizados,
        anulados: conveniosAnulados,
        porVencer: conveniosPorVencerRaw,
        porEstado: conveniosPorEstado,
      },
      cronograma: {
        programadasHoy: programadasHoyRaw,
        proximasEntregas: proximasEntregasRaw,
        reprogramadas: reprogramadasCount,
        canceladasMes: canceladasMesCount,
      },
      entregas: {
        totalMes: entregasRealizadasMes,
        kilosMes: kilosEntregadosMes,
        ultimasEntregas: ultimasEntregasRaw,
      },
      documentos: {
        total: documentosTotal,
        activos: documentosActivos,
        anulados: documentosAnulados,
        porTipo: documentosPorTipo,
        ultimosDocumentos,
      },
      auditoria: {
        actividadReciente: actividadRecienteRaw,
      },
      alertas,
    };
  }
}
