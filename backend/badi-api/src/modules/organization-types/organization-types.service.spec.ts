import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationTypesService } from './organization-types.service';

describe('OrganizationTypesService', () => {
  let service: OrganizationTypesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrganizationTypesService],
    }).compile();

    service = module.get<OrganizationTypesService>(OrganizationTypesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
