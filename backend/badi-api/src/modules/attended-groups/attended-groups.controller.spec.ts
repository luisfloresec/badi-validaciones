import { Test, TestingModule } from '@nestjs/testing';
import { AttendedGroupsController } from './attended-groups.controller';

describe('AttendedGroupsController', () => {
  let controller: AttendedGroupsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AttendedGroupsController],
    }).compile();

    controller = module.get<AttendedGroupsController>(AttendedGroupsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
