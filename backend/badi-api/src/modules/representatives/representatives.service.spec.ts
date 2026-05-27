import { Test, TestingModule } from '@nestjs/testing';
import { RepresentativesService } from './representatives.service';

describe('RepresentativesService', () => {
  let service: RepresentativesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RepresentativesService],
    }).compile();

    service = module.get<RepresentativesService>(RepresentativesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
