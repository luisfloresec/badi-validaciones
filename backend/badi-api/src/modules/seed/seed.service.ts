import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { UserRole } from '../user-roles/entities/user-role.entity';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Role) private readonly roleRepository: Repository<Role>,
    @InjectRepository(UserRole) private readonly userRoleRepository: Repository<UserRole>,
  ) {}

  async onApplicationBootstrap() {
    this.logger.log('Verificando datos iniciales (Seed)...');
    await this.seedRoles();
    await this.seedAdminUser();
    this.logger.log('Seed completado.');
  }

  private async seedRoles() {
    const rolesRequeridos = ['Administrador', 'Gestión Social', 'Auditor'];

    for (const nombre of rolesRequeridos) {
      const existe = await this.roleRepository.findOne({ where: { nombre } });
      if (!existe) {
        const nuevoRol = this.roleRepository.create({
          nombre,
          descripcion: `Rol de ${nombre}`,
          estado: 'Activo',
          perfilAcceso: nombre,
        });
        await this.roleRepository.save(nuevoRol);
        this.logger.log(`Rol "${nombre}" creado con perfilAcceso ${nombre}.`);
      } else if (!existe.perfilAcceso) {
        existe.perfilAcceso = nombre;
        await this.roleRepository.save(existe);
        this.logger.log(`Rol "${nombre}" actualizado con perfilAcceso ${nombre}.`);
      }
    }
  }

  private async seedAdminUser() {
    const adminEmail = 'admin@badi.local';
    let adminUser = await this.userRepository.findOne({ where: { email: adminEmail } });

    if (!adminUser) {
      const salt = await bcrypt.genSalt();
      const passwordHash = await bcrypt.hash('Admin12345*', salt);

      adminUser = this.userRepository.create({
        nombres: 'Administrador',
        apellidos: 'BADI',
        email: adminEmail,
        passwordHash,
        estado: 'Activo',
      });
      await this.userRepository.save(adminUser);
      this.logger.log(`Usuario administrador (${adminEmail}) creado.`);
    }

    // Asegurar que tiene el rol Administrador
    const rolAdmin = await this.roleRepository.findOne({ where: { nombre: 'Administrador' } });
    if (rolAdmin) {
      const existeRelacion = await this.userRoleRepository.findOne({
        where: { usuario: { id: adminUser.id }, rol: { id: rolAdmin.id } },
      });

      if (!existeRelacion) {
        const userRole = this.userRoleRepository.create({
          usuario: adminUser,
          rol: rolAdmin,
        });
        await this.userRoleRepository.save(userRole);
        this.logger.log(`Rol "Administrador" asignado al usuario ${adminEmail}.`);
      }
    }
  }
}
