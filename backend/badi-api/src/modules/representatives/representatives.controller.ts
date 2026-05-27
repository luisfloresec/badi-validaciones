import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { RepresentativesService } from './representatives.service';
import { CreateRepresentativeDto } from './dto/create-representative.dto';
import { UpdateRepresentativeDto } from './dto/update-representative.dto';

@Controller('representatives')
export class RepresentativesController {
  constructor(
    private readonly representativesService: RepresentativesService,
  ) {}

  /** POST /representatives — Crear un nuevo representante */
  @Post()
  create(@Body() createDto: CreateRepresentativeDto) {
    return this.representativesService.create(createDto);
  }

  /** GET /representatives — Listar representantes activos */
  @Get()
  findAll() {
    return this.representativesService.findAll();
  }

  /** GET /representatives/organization/:organizationId — Listar representantes activos de una organización */
  @Get('organization/:organizationId')
  findByOrganization(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
  ) {
    return this.representativesService.findByOrganization(organizationId);
  }

  /** GET /representatives/:id — Obtener representante por UUID */
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.representativesService.findOne(id);
  }

  /** PATCH /representatives/:id — Actualizar datos del representante */
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateRepresentativeDto,
  ) {
    return this.representativesService.update(id, updateDto);
  }

  /** PATCH /representatives/:id/deactivate — Desactivar representante */
  @Patch(':id/deactivate')
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.representativesService.deactivate(id);
  }
}
