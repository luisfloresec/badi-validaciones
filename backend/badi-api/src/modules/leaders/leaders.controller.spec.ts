import { Test, TestingModule } from '@nestjs/testing';
import { LeadersController } from './leaders.controller';

describe('LeadersController', () => {
  let controller: LeadersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LeadersController],
    }).compile();

    controller = module.get<LeadersController>(LeadersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
