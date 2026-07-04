import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { ExcelGeneratorService } from '../reports/services/excel-generator.service';
import * as ExcelJS from 'exceljs';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
    private readonly excelGeneratorService: ExcelGeneratorService,
  ) {}

  async findAll(query: any) {
    const { search, modulo, userId, accion, fechaDesde, fechaHasta, limit = 1000, offset = 0 } = query;

    const qb = this.auditRepository.createQueryBuilder('audit')
      .leftJoinAndSelect('audit.user', 'user')
      .orderBy('audit.fechaHora', 'DESC')
      .take(limit)
      .skip(offset);

    if (modulo) {
      qb.andWhere('audit.modulo = :modulo', { modulo });
    }
    if (userId) {
      qb.andWhere('audit.userId = :userId', { userId });
    }
    if (accion) {
      qb.andWhere('audit.accion = :accion', { accion });
    }
    if (fechaDesde) {
      qb.andWhere('audit.fechaHora >= :fechaDesde', { fechaDesde });
    }
    if (fechaHasta) {
      qb.andWhere('audit.fechaHora <= :fechaHasta', { fechaHasta });
    }
    if (search) {
      qb.andWhere('(user.nombres ILIKE :search OR user.apellidos ILIKE :search OR user.email ILIKE :search OR audit.modulo ILIKE :search OR audit.entidad ILIKE :search OR audit.accion ILIKE :search OR audit.entidadId ILIKE :search OR audit.resultado ILIKE :search)', { search: `%${search}%` });
    }

    const [items, total] = await qb.getManyAndCount();

    // Limpiar datos sensibles
    const sanitizedItems = items.map(item => {
      const cleanData = (data: any) => {
        if (!data || typeof data !== 'object') return data;
        const copy = { ...data };
        const sensitiveKeys = ['password', 'passwordhash', 'password_hash', 'token', 'tokens', 'secret', 'secrets', 'credentials', 'env'];
        for (const key of Object.keys(copy)) {
          if (sensitiveKeys.some(s => key.toLowerCase().includes(s))) {
            delete copy[key];
          } else if (typeof copy[key] === 'object') {
            copy[key] = cleanData(copy[key]);
          }
        }
        return copy;
      };

      return {
        ...item,
        datosAnteriores: cleanData(item.datosAnteriores),
        datosNuevos: cleanData(item.datosNuevos),
      };
    });

    return { items: sanitizedItems, total };
  }

  async exportToExcel(query: any): Promise<ExcelJS.Workbook> {
    const fetchQuery = { ...query, limit: 1000000, offset: 0 };
    const { items } = await this.findAll(fetchQuery);

    const excelData = items.map(log => ({
      fecha: log.fechaHora ? new Date(log.fechaHora) : null,
      usuario: log.user ? `${log.user.nombres} ${log.user.apellidos}` : 'Sistema',
      modulo: log.modulo || '—',
      accion: log.accion || '—',
      entidad: log.entidad || '—',
      resultado: log.resultado || '—'
    }));

    return this.excelGeneratorService.generateExcel({
      title: 'Reporte de Auditoría',
      sheetName: 'Auditoría',
      columns: [
        { header: 'Fecha y Hora', key: 'fecha', width: 25 },
        { header: 'Usuario', key: 'usuario', width: 35 },
        { header: 'Módulo', key: 'modulo', width: 25 },
        { header: 'Acción', key: 'accion', width: 20 },
        { header: 'Entidad Afectada', key: 'entidad', width: 30 },
        { header: 'Resultado', key: 'resultado', width: 15 }
      ],
      data: excelData
    });
  }
}
