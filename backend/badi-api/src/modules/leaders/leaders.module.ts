import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeadersService } from './leaders.service';
import { LeadersController } from './leaders.controller';
import { Leader } from './entities/leader.entity';
import { AttendedGroup } from '../attended-groups/entities/attended-group.entity';
import { Representative } from '../representatives/entities/representative.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Leader, AttendedGroup, Representative])],
  controllers: [LeadersController],
  providers: [LeadersService],
  exports: [LeadersService],
})
export class LeadersModule {}
