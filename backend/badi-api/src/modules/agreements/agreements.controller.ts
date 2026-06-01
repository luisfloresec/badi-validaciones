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

@Controller('agreements')
export class AgreementsController {
  constructor(private readonly agreementsService: AgreementsService) {}

  @Get('types')
  findTypes() {
    return this.agreementsService.findTypes();
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

  @Patch(':id/deactivate')
  deactivate(@Param('id') id: string) {
    return this.agreementsService.deactivate(id);
  }
}
