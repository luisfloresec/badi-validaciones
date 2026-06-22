import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { Roles } from '../auth/decorators/roles.decorator';

import { ReplaceRepresentativeDto } from './dto/replace-representative.dto';
import { CreateAttendedGroupWithLeaderDto } from './dto/create-group-with-leader.dto';

@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  /** POST /organizations — Crear una nueva organización */
  @Roles('Administrador', 'Gestión Social')
  @Post()
  create(@Body() createDto: CreateOrganizationDto) {
    return this.organizationsService.create(createDto);
  }

  /** GET /organizations — Listar organizaciones (por defecto no inactivas) */
  @Get()
  findAll(@Query('includeInactive') includeInactive?: string) {
    return this.organizationsService.findAll(includeInactive === 'true');
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
  @Roles('Administrador', 'Gestión Social')
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateOrganizationDto,
  ) {
    return this.organizationsService.update(id, updateDto);
  }

  /** PATCH /organizations/:id/deactivate — Desactivar organización */
  @Roles('Administrador', 'Gestión Social')
  @Patch(':id/deactivate')
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.organizationsService.deactivate(id);
  }

  /** PATCH /organizations/:id/activate — Reactivar organización */
  @Roles('Administrador')
  @Patch(':id/activate')
  activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.organizationsService.activate(id);
  }

  /** POST /organizations/:id/representatives/replace — Reemplazar representante activo */
  @Roles('Administrador', 'Gestión Social')
  @Post(':id/representatives/replace')
  replaceRepresentative(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReplaceRepresentativeDto,
  ) {
    return this.organizationsService.replaceRepresentative(id, dto);
  }

  /** POST /organizations/:id/attended-groups/with-leader — Crear grupo con dirigente */
  @Roles('Administrador', 'Gestión Social')
  @Post(':id/attended-groups/with-leader')
  createAttendedGroupWithLeader(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateAttendedGroupWithLeaderDto,
  ) {
    return this.organizationsService.createAttendedGroupWithLeader(id, dto);
  }
}
