import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { Role } from './schemas/user.schema';

describe('UsersController', () => {
  let controller: UsersController;

  const mockUsersService = {
    create: jest.fn().mockResolvedValue({
      _id: '123',
      email: 'test@test.com',
      role: Role.GUEST,
    }),
    update: jest.fn().mockResolvedValue({
      _id: '123',
      email: 'updated@test.com',
      role: Role.GUEST,
    }),
    findAll: jest.fn().mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 20,
    }),
    countAdmins: jest.fn().mockResolvedValue(0),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('seed', () => {
    it('should create admin if no admins exist', async () => {
      mockUsersService.countAdmins.mockResolvedValue(0);
      mockUsersService.create.mockResolvedValue({
        _id: '123',
        email: 'admin@test.com',
        role: Role.ADMIN,
      });

      const result = await controller.seed({
        email: 'admin@test.com',
        password: 'admin123',
      });
      expect(result.role).toBe(Role.ADMIN);
    });

    it('should throw if an admin already exists', async () => {
      mockUsersService.countAdmins.mockResolvedValue(1);

      await expect(
        controller.seed({ email: 'admin@test.com', password: 'admin123' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const result = await controller.findAll({ page: '1', limit: '20' });
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });
  });
});
