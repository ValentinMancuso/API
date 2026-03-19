import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UsersService } from './users.service';
import { User, Role } from './schemas/user.schema';

describe('UsersService', () => {
  let service: UsersService;

  const mockUser = {
    _id: '123',
    email: 'juan.perez@test.com',
    password: 'password',
    role: Role.GUEST,
  };

  const mockUserModel: any = jest.fn();
  mockUserModel.findOne = jest.fn();
  mockUserModel.findById = jest.fn();
  mockUserModel.findByIdAndUpdate = jest.fn();
  mockUserModel.find = jest.fn();
  mockUserModel.countDocuments = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should save a new user', async () => {
      const saveMock = jest.fn().mockResolvedValue(mockUser);
      mockUserModel.mockImplementation(() => ({ save: saveMock }));

      await service.create('juan.perez@test.com', 'plainpassword', Role.GUEST);
      expect(saveMock).toHaveBeenCalled();
    });

    it('should hash the password before saving', async () => {
      const saveMock = jest.fn().mockResolvedValue(mockUser);
      mockUserModel.mockImplementation(() => ({ save: saveMock }));

      await service.create('juan.perez@test.com', 'plainpassword', Role.GUEST);

      const savedData = mockUserModel.mock.calls[0][0];
      expect(savedData.password).not.toBe('plainpassword');
      const isHashed = await bcrypt.compare(
        'plainpassword',
        savedData.password,
      );
      expect(isHashed).toBe(true);
    });
  });

  describe('update', () => {
    it('should update the user', async () => {
      mockUserModel.findByIdAndUpdate.mockReturnValue({
        exec: jest
          .fn()
          .mockResolvedValue({ ...mockUser, email: 'new@test.com' }),
      });

      const result = await service.update('123', { email: 'new@test.com' });
      expect(result?.email).toBe('new@test.com');
    });

    it('should hash the password when updating it', async () => {
      mockUserModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      await service.update('123', { password: 'newpassword' });

      const updatedData = mockUserModel.findByIdAndUpdate.mock.calls[0][1];
      expect(updatedData.password).not.toBe('newpassword');
      const isHashed = await bcrypt.compare(
        'newpassword',
        updatedData.password,
      );
      expect(isHashed).toBe(true);
    });
  });

  describe('findByEmail', () => {
    it('should return a user if found', async () => {
      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      const result = await service.findByEmail('juan.perez@test.com');
      expect(result).toEqual(mockUser);
      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        email: 'juan.perez@test.com',
      });
    });

    it('should return null if user not found', async () => {
      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.findByEmail('noexiste@test.com');
      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return a user by id', async () => {
      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      const result = await service.findById('123');
      expect(result).toEqual(mockUser);
    });
  });

  describe('seed', () => {
    it('should create admin if no admins exist', async () => {
      mockUserModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(0),
      });
      const saveMock = jest.fn().mockResolvedValue({
        _id: '123',
        email: 'admin@test.com',
        role: Role.ADMIN,
      });
      mockUserModel.mockImplementation(() => ({ save: saveMock }));

      const result = await service.seed('admin@test.com', 'admin123');
      expect(result.role).toBe(Role.ADMIN);
      expect(mockUserModel.countDocuments).toHaveBeenCalledWith({
        role: Role.ADMIN,
      });
    });

    it('should throw if an admin already exists', async () => {
      mockUserModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(1),
      });

      await expect(service.seed('admin@test.com', 'admin123')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const users = [mockUser];
      mockUserModel.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue(users),
            }),
          }),
        }),
      });
      mockUserModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(1),
      });

      const result = await service.findAll(1, 20);
      expect(result.data).toEqual([
        {
          id: mockUser._id,
          email: mockUser.email,
          role: mockUser.role,
        },
      ]);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should filter by email case insensitive', async () => {
      mockUserModel.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });
      mockUserModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(0),
      });

      await service.findAll(1, 20, 'test@');
      expect(mockUserModel.find).toHaveBeenCalledWith({
        email: { $regex: 'test@', $options: 'i' },
      });
    });
  });
});
