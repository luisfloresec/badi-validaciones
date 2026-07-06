import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './modules/auth/decorators/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  /** Endpoint público de salud para monitoreo en Render */
  @Public()
  @Get('health')
  health(): { status: string; service: string } {
    return { status: 'ok', service: 'badi-api' };
  }
}
