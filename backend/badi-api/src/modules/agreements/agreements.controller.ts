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

  @Post('types')
  createType(@Body() createDto: CreateAgreementTypeDto) {
    return this.agreementsService.createType(createDto);
  }

  @Patch('types/:id')
  updateType(@Param('id') id: string, @Body() updateDto: UpdateAgreementTypeDto) {
    return this.agreementsService.updateType(id, updateDto);
  }

  @Patch('types/:id/deactivate')
  deactivateType(@Param('id') id: string) {
    return this.agreementsService.deactivateType(id);
  }

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

  @Post()
  create(@Body() createDto: CreateAgreementDto) {
    return this.agreementsService.create(createDto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateAgreementDto) {
    return this.agreementsService.update(id, updateDto);
  }

  @Patch(':id/activate')
  activate(@Param('id') id: string) {
    return this.agreementsService.activate(id);
  }

  @Patch(':id/finalize')
  finalize(@Param('id') id: string, @Body() body: { motivo?: string }) {
    return this.agreementsService.finalize(id, body?.motivo);
  }

  @Patch(':id/deactivate')
  deactivate(@Param('id') id: string) {
    return this.agreementsService.deactivate(id);
  }
}
