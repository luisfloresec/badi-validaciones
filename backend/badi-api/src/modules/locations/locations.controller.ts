import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { LocationsService } from './locations.service';

@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  /** GET /locations/provinces — Lista todas las provincias activas */
  @Get('provinces')
  getProvinces() {
    return this.locationsService.getProvinces();
  }

  /** GET /locations/provinces/:provinceId/cities — Ciudades activas de una provincia */
  @Get('provinces/:provinceId/cities')
  getCitiesByProvince(@Param('provinceId', ParseUUIDPipe) provinceId: string) {
    return this.locationsService.getCitiesByProvince(provinceId);
  }
}
