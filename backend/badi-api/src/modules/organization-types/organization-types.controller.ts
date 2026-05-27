import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { OrganizationTypesService } from './organization-types.service';
import { CreateOrganizationTypeDto } from './dto/create-organization-type.dto';
import { UpdateOrganizationTypeDto } from './dto/update-organization-type.dto';

@Controller('organization-types')
export class OrganizationTypesController {
  constructor(
    private readonly organizationTypesService: OrganizationTypesService,
  ) {}

  /** POST /organization-types — Crear un nuevo tipo de organización */
  @Post()
  create(@Body() createDto: CreateOrganizationTypeDto) {
    return this.organizationTypesService.create(createDto);
  }

  /** GET /organization-types — Listar tipos de organización activos */
  @Get()
  findAll() {
    return this.organizationTypesService.findAll();
  }

  /** GET /organization-types/:id — Obtener tipo de organización por UUID */
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.organizationTypesService.findOne(id);
  }

  /** PATCH /organization-types/:id — Actualizar nombre y/o descripción */
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateOrganizationTypeDto,
  ) {
    return this.organizationTypesService.update(id, updateDto);
  }

  /** PATCH /organization-types/:id/deactivate — Desactivar (estado -> Inactivo) */
  @Patch(':id/deactivate')
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.organizationTypesService.deactivate(id);
  }
}
