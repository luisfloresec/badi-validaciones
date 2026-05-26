import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { UserRolesService } from './user-roles.service';
import { AssignRoleDto } from './dto/assign-role.dto';

@Controller('user-roles')
export class UserRolesController {
  constructor(private readonly userRolesService: UserRolesService) {}

  /** POST /user-roles — Asignar un rol a un usuario */
  @Post()
  assign(@Body() assignRoleDto: AssignRoleDto) {
    return this.userRolesService.assign(assignRoleDto);
  }

  /** GET /user-roles — Listar todas las asignaciones usuario-rol */
  @Get()
  findAll() {
    return this.userRolesService.findAll();
  }

  /** GET /user-roles/user/:userId — Listar roles asignados a un usuario */
  @Get('user/:userId')
  findByUser(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.userRolesService.findByUser(userId);
  }

  /** DELETE /user-roles/:id — Eliminar una asignación usuario-rol */
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.userRolesService.remove(id);
  }
}
