import { Test, TestingModule } from '@nestjs/testing';
import { AttendedGroupsService } from './attended-groups.service';

describe('AttendedGroupsService', () => {
  let service: AttendedGroupsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AttendedGroupsService],
    }).compile();

    service = module.get<AttendedGroupsService>(AttendedGroupsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
