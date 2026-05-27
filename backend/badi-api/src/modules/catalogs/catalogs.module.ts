import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogsService } from './catalogs.service';
import { CatalogsController } from './catalogs.controller';
import { Catalog } from './entities/catalog.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Catalog])],
  controllers: [CatalogsController],
  providers: [CatalogsService],
  exports: [CatalogsService],
})
export class CatalogsModule {}
