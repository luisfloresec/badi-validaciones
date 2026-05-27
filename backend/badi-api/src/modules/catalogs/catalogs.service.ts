import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Catalog } from './entities/catalog.entity';
import { CreateCatalogDto } from './dto/create-catalog.dto';
import { UpdateCatalogDto } from './dto/update-catalog.dto';

@Injectable()
export class CatalogsService {
  constructor(
    @InjectRepository(Catalog)
    private readonly catalogsRepository: Repository<Catalog>,
  ) {}

  /**
   * Crea un nuevo valor de catálogo con estado Activo.
   * Valida que no exista duplicado por tipoCatalogo + nombre.
   */
  async create(createCatalogDto: CreateCatalogDto): Promise<Catalog> {
    const exists = await this.catalogsRepository.findOne({
      where: {
        tipoCatalogo: createCatalogDto.tipoCatalogo,
        nombre: createCatalogDto.nombre,
      },
    });
    if (exists) {
      throw new ConflictException(
        'Ya existe un valor con este nombre en el mismo tipo de catálogo.',
      );
    }

    const catalog = this.catalogsRepository.create({
      ...createCatalogDto,
      estado: 'Activo',
    });

    return this.catalogsRepository.save(catalog);
  }

  /**
   * Lista todos los valores de catálogo con estado Activo.
   */
  async findAll(): Promise<Catalog[]> {
    return this.catalogsRepository.find({
      where: { estado: 'Activo' },
    });
  }

  /**
   * Lista valores activos filtrados por tipo de catálogo.
   */
  async findByType(tipoCatalogo: string): Promise<Catalog[]> {
    return this.catalogsRepository.find({
      where: { tipoCatalogo, estado: 'Activo' },
    });
  }

  /**
   * Busca un valor de catálogo por su UUID.
   * Lanza NotFoundException si no existe.
   */
  async findOne(id: string): Promise<Catalog> {
    const catalog = await this.catalogsRepository.findOne({ where: { id } });
    if (!catalog) {
      throw new NotFoundException(`Catálogo con id ${id} no encontrado.`);
    }
    return catalog;
  }

  /**
   * Actualiza nombre, descripcion y/o tipoCatalogo de un valor de catálogo.
   * Si cambia tipoCatalogo o nombre, valida unicidad de la combinación.
   * No permite modificar el estado desde este método.
   */
  async update(
    id: string,
    updateCatalogDto: UpdateCatalogDto,
  ): Promise<Catalog> {
    const catalog = await this.catalogsRepository.findOne({ where: { id } });
    if (!catalog) {
      throw new NotFoundException(`Catálogo con id ${id} no encontrado.`);
    }

    // Determinar los valores finales de tipoCatalogo y nombre
    const finalTipo = updateCatalogDto.tipoCatalogo ?? catalog.tipoCatalogo;
    const finalNombre = updateCatalogDto.nombre ?? catalog.nombre;

    // Validar unicidad si cambia tipoCatalogo o nombre
    if (finalTipo !== catalog.tipoCatalogo || finalNombre !== catalog.nombre) {
      const duplicate = await this.catalogsRepository.findOne({
        where: { tipoCatalogo: finalTipo, nombre: finalNombre },
      });
      if (duplicate && duplicate.id !== id) {
        throw new ConflictException(
          'Ya existe un valor con este nombre en el mismo tipo de catálogo.',
        );
      }
    }

    Object.assign(catalog, updateCatalogDto);
    return this.catalogsRepository.save(catalog);
  }

  /**
   * Desactiva un valor de catálogo cambiando su estado a Inactivo.
   * No elimina físicamente el registro.
   */
  async deactivate(id: string): Promise<Catalog> {
    const catalog = await this.catalogsRepository.findOne({ where: { id } });
    if (!catalog) {
      throw new NotFoundException(`Catálogo con id ${id} no encontrado.`);
    }

    if (catalog.estado === 'Inactivo') {
      throw new ConflictException('El catálogo ya se encuentra inactivo.');
    }

    catalog.estado = 'Inactivo';
    return this.catalogsRepository.save(catalog);
  }
}
