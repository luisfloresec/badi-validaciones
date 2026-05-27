import { Test, TestingModule } from '@nestjs/testing';
import { LeadersService } from './leaders.service';

describe('LeadersService', () => {
  let service: LeadersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LeadersService],
    }).compile();

    service = module.get<LeadersService>(LeadersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
