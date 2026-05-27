import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationTypesController } from './organization-types.controller';

describe('OrganizationTypesController', () => {
  let controller: OrganizationTypesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrganizationTypesController],
    }).compile();

    controller = module.get<OrganizationTypesController>(OrganizationTypesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
