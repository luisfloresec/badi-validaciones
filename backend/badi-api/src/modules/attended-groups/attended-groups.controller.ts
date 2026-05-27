import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { AttendedGroupsService } from './attended-groups.service';
import { CreateAttendedGroupDto } from './dto/create-attended-group.dto';
import { UpdateAttendedGroupDto } from './dto/update-attended-group.dto';

@Controller('attended-groups')
export class AttendedGroupsController {
  constructor(
    private readonly attendedGroupsService: AttendedGroupsService,
  ) {}

  /** POST /attended-groups — Crear un nuevo grupo atendido */
  @Post()
  create(@Body() createDto: CreateAttendedGroupDto) {
    return this.attendedGroupsService.create(createDto);
  }

  /** GET /attended-groups — Listar grupos atendidos activos */
  @Get()
  findAll() {
    return this.attendedGroupsService.findAll();
  }

  /** GET /attended-groups/organization/:organizationId — Listar grupos activos de una organización */
  @Get('organization/:organizationId')
  findByOrganization(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
  ) {
    return this.attendedGroupsService.findByOrganization(organizationId);
  }

  /** GET /attended-groups/:id — Obtener grupo atendido por UUID */
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.attendedGroupsService.findOne(id);
  }

  /** PATCH /attended-groups/:id — Actualizar datos del grupo atendido */
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateAttendedGroupDto,
  ) {
    return this.attendedGroupsService.update(id, updateDto);
  }

  /** PATCH /attended-groups/:id/deactivate — Desactivar grupo atendido */
  @Patch(':id/deactivate')
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.attendedGroupsService.deactivate(id);
  }
}
