import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  /** POST /organizations — Crear una nueva organización */
  @Post()
  create(@Body() createDto: CreateOrganizationDto) {
    return this.organizationsService.create(createDto);
  }

  /** GET /organizations — Listar organizaciones activas y registradas */
  @Get()
  findAll() {
    return this.organizationsService.findAll();
  }

  /** GET /organizations/ruc/:ruc — Buscar organización por RUC */
  @Get('ruc/:ruc')
  findByRuc(@Param('ruc') ruc: string) {
    return this.organizationsService.findByRuc(ruc);
  }

  /** GET /organizations/:id/full-detail — Detalle completo de la organización */
  @Get(':id/full-detail')
  getFullDetail(@Param('id', ParseUUIDPipe) id: string) {
    return this.organizationsService.getFullDetail(id);
  }

  /** GET /organizations/:id — Obtener organización por UUID */
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.organizationsService.findOne(id);
  }

  /** PATCH /organizations/:id — Actualizar datos de organización */
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateOrganizationDto,
  ) {
    return this.organizationsService.update(id, updateDto);
  }

  /** PATCH /organizations/:id/deactivate — Desactivar organización */
  @Patch(':id/deactivate')
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.organizationsService.deactivate(id);
  }
}
