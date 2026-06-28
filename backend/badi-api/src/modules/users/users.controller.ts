import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@Roles('Administrador')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /** POST /users — Crear un nuevo usuario */
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  /** GET /users — Listar usuarios activos */
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  /** GET /users/:id — Obtener usuario por UUID */
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  /** PATCH /users/:id — Actualizar datos permitidos del usuario */
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  /** PATCH /users/:id/deactivate — Desactivar usuario (estado -> Inactivo) */
  @Patch(':id/deactivate')
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.deactivate(id);
  }

  /** PATCH /users/:id/activate — Reactivar usuario (estado -> Activo) */
  @Patch(':id/activate')
  activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.activate(id);
  }
}
