import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  NotImplementedException,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@Roles('Administrador')
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  /** GET /roles/all — Listar roles (activos e inactivos) */
  @Get('all')
  findAllAll() {
    return this.rolesService.findAllAll();
  }

  /** GET /roles — Listar roles activos */
  @Get()
  findAll() {
    return this.rolesService.findAll();
  }

  /** GET /roles/:id — Obtener rol por UUID */
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.rolesService.findOne(id);
  }

  /** PATCH /roles/:id — Actualizar nombre y/o descripcion del rol */
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return this.rolesService.update(id, updateRoleDto);
  }

  /** PATCH /roles/:id/deactivate — Desactivar rol (estado -> Inactivo) */
  @Patch(':id/deactivate')
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.rolesService.deactivate(id);
  }

  /** PATCH /roles/:id/activate — Reactivar rol (estado -> Activo) */
  @Patch(':id/activate')
  activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.rolesService.activate(id);
  }
}
