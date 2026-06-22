import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DocumentTypesService } from './document-types.service';
import { CreateDocumentTypeDto } from './dto/create-document-type.dto';
import { UpdateDocumentTypeDto } from './dto/update-document-type.dto';
import { DocumentType } from './entities/document-type.entity';

@Controller('documents/types')
export class DocumentTypesController {
  constructor(private readonly documentTypesService: DocumentTypesService) {}

  /**
   * GET /documents/types
   * Lista solo los tipos documentales activos.
   */
  @Get()
  findActive(): Promise<DocumentType[]> {
    return this.documentTypesService.findActive();
  }

  /**
   * GET /documents/types/all
   * Lista todos los tipos documentales (incluye inactivos).
   */
  @Get('all')
  findAll(): Promise<DocumentType[]> {
    return this.documentTypesService.findAll();
  }

  /**
   * GET /documents/types/:id
   * Detalle de un tipo documental por ID.
   */
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<DocumentType> {
    return this.documentTypesService.findOne(id);
  }

  /**
   * POST /documents/types
   * Crear un nuevo tipo documental.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateDocumentTypeDto): Promise<DocumentType> {
    return this.documentTypesService.create(dto);
  }

  /**
   * PATCH /documents/types/:id
   * Editar un tipo documental existente.
   */
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDocumentTypeDto,
  ): Promise<DocumentType> {
    return this.documentTypesService.update(id, dto);
  }

  /**
   * PATCH /documents/types/:id/deactivate
   * Desactivar un tipo documental.
   */
  @Patch(':id/deactivate')
  deactivate(@Param('id', ParseUUIDPipe) id: string): Promise<DocumentType> {
    return this.documentTypesService.deactivate(id);
  }

  /**
   * PATCH /documents/types/:id/activate
   * Reactivar un tipo documental.
   */
  @Patch(':id/activate')
  activate(@Param('id', ParseUUIDPipe) id: string): Promise<DocumentType> {
    return this.documentTypesService.activate(id);
  }
}
