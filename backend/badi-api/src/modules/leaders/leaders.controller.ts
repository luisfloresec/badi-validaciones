import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { LeadersService } from './leaders.service';
import { CreateLeaderDto } from './dto/create-leader.dto';
import { UpdateLeaderDto } from './dto/update-leader.dto';

@Controller('leaders')
export class LeadersController {
  constructor(private readonly leadersService: LeadersService) {}

  /** POST /leaders — Crear un nuevo dirigente */
  @Post()
  create(@Body() createDto: CreateLeaderDto) {
    return this.leadersService.create(createDto);
  }

  /** GET /leaders — Listar dirigentes activos */
  @Get()
  findAll() {
    return this.leadersService.findAll();
  }

  /** GET /leaders/group/:groupId — Listar dirigentes activos de un grupo atendido */
  @Get('group/:groupId')
  findByGroup(@Param('groupId', ParseUUIDPipe) groupId: string) {
    return this.leadersService.findByGroup(groupId);
  }

  /** GET /leaders/:id — Obtener dirigente por UUID */
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.leadersService.findOne(id);
  }

  /** PATCH /leaders/:id — Actualizar datos del dirigente */
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateLeaderDto,
  ) {
    return this.leadersService.update(id, updateDto);
  }

  /** PATCH /leaders/:id/deactivate — Desactivar dirigente */
  @Patch(':id/deactivate')
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.leadersService.deactivate(id);
  }
}
