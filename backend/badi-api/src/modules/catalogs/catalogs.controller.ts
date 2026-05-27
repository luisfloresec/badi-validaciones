import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CatalogsService } from './catalogs.service';
import { CreateCatalogDto } from './dto/create-catalog.dto';
import { UpdateCatalogDto } from './dto/update-catalog.dto';

@Controller('catalogs')
export class CatalogsController {
  constructor(private readonly catalogsService: CatalogsService) {}

  /** POST /catalogs — Crear un nuevo valor de catálogo */
  @Post()
  create(@Body() createCatalogDto: CreateCatalogDto) {
    return this.catalogsService.create(createCatalogDto);
  }

  /** GET /catalogs — Listar valores activos */
  @Get()
  findAll() {
    return this.catalogsService.findAll();
  }

  /** GET /catalogs/type/:tipoCatalogo — Listar valores activos por tipo */
  @Get('type/:tipoCatalogo')
  findByType(@Param('tipoCatalogo') tipoCatalogo: string) {
    return this.catalogsService.findByType(tipoCatalogo);
  }

  /** GET /catalogs/:id — Obtener valor por UUID */
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalogsService.findOne(id);
  }

  /** PATCH /catalogs/:id — Actualizar nombre, descripcion o tipoCatalogo */
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCatalogDto: UpdateCatalogDto,
  ) {
    return this.catalogsService.update(id, updateCatalogDto);
  }

  /** PATCH /catalogs/:id/deactivate — Desactivar catálogo (estado -> Inactivo) */
  @Patch(':id/deactivate')
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalogsService.deactivate(id);
  }
}
