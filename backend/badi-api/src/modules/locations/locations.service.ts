import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Province } from './entities/province.entity';
import { City } from './entities/city.entity';

/** Datos de seed para provincias base del sistema */
const SEED_DATA: Array<{ nombre: string; codigo: string; ciudades: string[] }> = [
  {
    nombre: 'IMBABURA',
    codigo: '10',
    ciudades: ['IBARRA', 'OTAVALO', 'COTACACHI', 'ANTONIO ANTE', 'PIMAMPIRO', 'URCUQUÍ'],
  },
  {
    nombre: 'PICHINCHA',
    codigo: '17',
    ciudades: ['QUITO', 'RUMIÑAHUI', 'CAYAMBE', 'PEDRO MONCAYO', 'MEJÍA', 'PUERTO QUITO'],
  },
];

@Injectable()
export class LocationsService implements OnModuleInit {
  constructor(
    @InjectRepository(Province)
    private readonly provinceRepo: Repository<Province>,

    @InjectRepository(City)
    private readonly cityRepo: Repository<City>,
  ) {}

  /** Se ejecuta al inicializar el módulo — carga datos base si no existen. */
  async onModuleInit(): Promise<void> {
    await this.seedLocations();
  }

  /** Inserta provincias y ciudades iniciales de forma idempotente (case-insensitive). */
  async seedLocations(): Promise<void> {
    for (const item of SEED_DATA) {
      // Búsqueda case-insensitive para evitar duplicar registros con diferente capitalización
      let province = await this.provinceRepo
        .createQueryBuilder('p')
        .where('UPPER(TRIM(p.nombre)) = :nombre', { nombre: item.nombre.trim().toUpperCase() })
        .getOne();

      if (!province) {
        province = this.provinceRepo.create({
          nombre: item.nombre,
          codigo: item.codigo,
          estado: 'Activo',
        });
        province = await this.provinceRepo.save(province);
      }

      for (const ciudadNombre of item.ciudades) {
        // Búsqueda case-insensitive por nombre y provincia
        const existingCity = await this.cityRepo
          .createQueryBuilder('c')
          .where('c.id_provincia = :provId', { provId: province.id })
          .andWhere('UPPER(TRIM(c.nombre)) = :nombre', { nombre: ciudadNombre.trim().toUpperCase() })
          .getOne();

        if (!existingCity) {
          const city = this.cityRepo.create({
            nombre: ciudadNombre,
            provincia: province,
            estado: 'Activo',
          });
          await this.cityRepo.save(city);
        }
      }
    }
  }


  /** Devuelve todas las provincias activas, ordenadas por nombre. */
  async getProvinces(): Promise<Province[]> {
    return this.provinceRepo.find({
      where: { estado: 'Activo' },
      order: { nombre: 'ASC' },
    });
  }

  /** Devuelve ciudades activas de una provincia específica. */
  async getCitiesByProvince(provinceId: string): Promise<City[]> {
    const province = await this.provinceRepo.findOne({ where: { id: provinceId } });
    if (!province) {
      throw new NotFoundException(`Provincia con id ${provinceId} no encontrada.`);
    }
    return this.cityRepo.find({
      where: { provincia: { id: provinceId }, estado: 'Activo' },
      order: { nombre: 'ASC' },
    });
  }

  /** Valida que una provincia exista y esté activa. */
  async validateProvince(provinceId: string): Promise<Province> {
    const province = await this.provinceRepo.findOne({ where: { id: provinceId } });
    if (!province) {
      throw new NotFoundException(`Provincia con id ${provinceId} no encontrada.`);
    }
    if (province.estado !== 'Activo') {
      throw new NotFoundException(`La provincia indicada no está activa.`);
    }
    return province;
  }

  /** Valida que una ciudad exista, esté activa y pertenezca a la provincia indicada. */
  async validateCity(cityId: string, provinceId: string): Promise<City> {
    const city = await this.cityRepo.findOne({
      where: { id: cityId },
      relations: { provincia: true },
    });
    if (!city) {
      throw new NotFoundException(`Ciudad con id ${cityId} no encontrada.`);
    }
    if (city.estado !== 'Activo') {
      throw new NotFoundException(`La ciudad indicada no está activa.`);
    }
    if (city.provincia.id !== provinceId) {
      throw new NotFoundException(
        `La ciudad ${city.nombre} no pertenece a la provincia indicada.`,
      );
    }
    return city;
  }
}
