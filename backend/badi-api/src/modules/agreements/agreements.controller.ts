import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { AgreementsService } from './agreements.service';
import { CreateAgreementDto } from './dto/create-agreement.dto';
import { UpdateAgreementDto } from './dto/update-agreement.dto';
import { CreateAgreementTypeDto } from './dto/create-agreement-type.dto';
import { UpdateAgreementTypeDto } from './dto/update-agreement-type.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('agreements')
export class AgreementsController {
  constructor(private readonly agreementsService: AgreementsService) {}

  @Get('types')
  findTypes() {
    return this.agreementsService.findTypes();
  }

  @Get('types/all')
  findAllTypes() {
    return this.agreementsService.findAllTypes();
  }

  @Get('types/:id')
  findTypeById(@Param('id') id: string) {
    return this.agreementsService.findTypeById(id);
  }

  @Roles('Administrador')
  @Post('types')
  createType(@Body() createDto: CreateAgreementTypeDto) {
    return this.agreementsService.createType(createDto);
  }

  @Roles('Administrador')
  @Patch('types/:id')
  updateType(@Param('id') id: string, @Body() updateDto: UpdateAgreementTypeDto) {
    return this.agreementsService.updateType(id, updateDto);
  }

  @Roles('Administrador')
  @Patch('types/:id/deactivate')
  deactivateType(@Param('id') id: string) {
    return this.agreementsService.deactivateType(id);
  }

  @Roles('Administrador')
  @Patch('types/:id/activate')
  activateType(@Param('id') id: string) {
    return this.agreementsService.activateType(id);
  }

  @Get()
  findAll() {
    return this.agreementsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.agreementsService.findOne(id);
  }

  @Roles('Administrador', 'Gestión Social')
  @Post()
  create(@Body() createDto: CreateAgreementDto) {
    return this.agreementsService.create(createDto);
  }

  @Roles('Administrador', 'Gestión Social')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateAgreementDto) {
    return this.agreementsService.update(id, updateDto);
  }

  @Roles('Administrador', 'Gestión Social')
  @Patch(':id/activate')
  activate(@Param('id') id: string) {
    return this.agreementsService.activate(id);
  }

  @Roles('Administrador', 'Gestión Social')
  @Patch(':id/finalize')
  finalize(@Param('id') id: string, @Body() body: { motivo?: string }) {
    return this.agreementsService.finalize(id, body?.motivo);
  }

  @Roles('Administrador', 'Gestión Social')
  @Patch(':id/deactivate')
  deactivate(@Param('id') id: string) {
    return this.agreementsService.deactivate(id);
  }
}
