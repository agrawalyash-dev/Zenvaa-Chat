import { Test, TestingModule } from '@nestjs/testing';
import { ConvexService } from './convex.service';

describe('ConvexService', () => {
  let service: ConvexService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConvexService],
    }).compile();

    service = module.get<ConvexService>(ConvexService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
