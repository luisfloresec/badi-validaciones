import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
  RemoveEvent,
} from 'typeorm';
import { ClsService } from 'nestjs-cls';
import { AuditLog } from '../entities/audit-log.entity';

@EventSubscriber()
export class AuditSubscriber implements EntitySubscriberInterface<any> {
  constructor(
    private dataSource: DataSource,
    private readonly cls: ClsService,
  ) {
    dataSource.subscribers.push(this);
  }

  // Ignorar la propia entidad AuditLog y User/UserRole si no queremos loop infinito, 
  // pero AuditLog es la importante a ignorar.
  private shouldAudit(entity: any, tableName?: string): boolean {
    if (!entity) return false;
    if (tableName === 'audit_logs') return false;
    if (tableName === 'password_reset_tokens') return false;
    return true;
  }

  async afterInsert(event: InsertEvent<any>) {
    if (!this.shouldAudit(event.entity, event.metadata.tableName)) return;
    await this.logEvent('CREATE', event, null, event.entity);
  }

  async afterUpdate(event: UpdateEvent<any>) {
    if (!this.shouldAudit(event.entity, event.metadata.tableName)) return;
    await this.logEvent('UPDATE', event, event.databaseEntity, event.entity);
  }

  async beforeRemove(event: RemoveEvent<any>) {
    if (!this.shouldAudit(event.entity, event.metadata.tableName)) return;
    await this.logEvent('DELETE', event, event.databaseEntity || event.entity, null);
  }

  private async logEvent(
    accion: string,
    event: InsertEvent<any> | UpdateEvent<any> | RemoveEvent<any>,
    oldData: any,
    newData: any,
  ) {
    const userId = this.cls.isActive() ? this.cls.get('userId') : null;
    
    // Solo auditamos si hay contexto web (userId) o si el negocio lo exige siempre.
    // Por ahora logueamos todo, con userId null si es proceso background.

    const entidadName = event.metadata.name;
    const tableName = event.metadata.tableName;
    
    // Intentar obtener ID
    let entidadId = null;
    if (newData && newData.id) entidadId = newData.id;
    else if (oldData && oldData.id) entidadId = oldData.id;

    // Removemos referencias circulares o relaciones anidadas complejas
    const sanitize = (data: any) => {
      if (!data) return null;
      const clean = { ...data };
      
      // Eliminar campos sensibles
      const camposSensibles = ['password', 'passwordHash', 'contrasena', 'token', 'tokenHash', 'secret'];
      for (const campo of camposSensibles) {
        if (clean[campo] !== undefined) {
          delete clean[campo];
        }
      }
      
      return clean;
    };

    const auditRepo = event.manager.getRepository(AuditLog);
    const auditLog = auditRepo.create({
      userId,
      modulo: tableName,
      entidad: entidadName,
      entidadId: entidadId ? String(entidadId) : null,
      accion,
      datosAnteriores: sanitize(oldData),
      datosNuevos: sanitize(newData),
      resultado: 'EXITO',
    });

    try {
      await auditRepo.save(auditLog);
    } catch (error) {
      console.error('Error guardando auditoría', error);
    }
  }
}
