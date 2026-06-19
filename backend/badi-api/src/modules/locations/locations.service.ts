import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Province } from './entities/province.entity';
import { City } from './entities/city.entity';

/** Datos de seed para Imbabura */
const SEED_DATA: Array<{ nombre: string; codigo: string; ciudades: string[] }> = [
  {
    nombre: 'Imbabura',
    codigo: '10',
    ciudades: ['Ibarra', 'Otavalo', 'Cotacachi', 'Antonio Ante', 'Pimampiro', 'Urcuquí'],
  },
  {
    nombre: 'Pichincha',
    codigo: '17',
    ciudades: ['Quito', 'Rumiñahui', 'Cayambe', 'Pedro Moncayo', 'Mejía', 'Puerto Quito'],
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

  /** Inserta provincias y ciudades iniciales de forma idempotente. */
  async seedLocations(): Promise<void> {
    for (const item of SEED_DATA) {
      let province = await this.provinceRepo.findOne({ where: { nombre: item.nombre } });

      if (!province) {
        province = this.provinceRepo.create({
          nombre: item.nombre,
          codigo: item.codigo,
          estado: 'Activo',
        });
        province = await this.provinceRepo.save(province);
      }

      for (const ciudadNombre of item.ciudades) {
        const existingCity = await this.cityRepo.findOne({
          where: { nombre: ciudadNombre, provincia: { id: province.id } },
        });
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
