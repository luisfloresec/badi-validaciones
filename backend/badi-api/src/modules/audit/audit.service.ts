import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
  ) {}

  async findAll(query: any) {
    const { modulo, userId, limit = 50, offset = 0 } = query;

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

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }
}
