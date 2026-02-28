import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { UsersService } from './users.service';
import { User, Role } from './schemas/user.schema';

describe('UsersService', () => {
  let service: UsersService;

  const mockUser = {
    _id: '123',
    email: 'test@test.com',
    password: 'hashedpassword',
    role: Role.GUEST,
  };

  // Tiene que ser jest.fn() (no un objeto) para poder usarlo como constructor (new Model())
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

      await service.create('test@test.com', 'plainpassword', Role.GUEST);
      expect(saveMock).toHaveBeenCalled();
    });

    it('should hash the password before saving', async () => {
      const saveMock = jest.fn().mockResolvedValue(mockUser);
      mockUserModel.mockImplementation(() => ({ save: saveMock }));

      await service.create('test@test.com', 'plainpassword', Role.GUEST);

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

      const result = await service.findByEmail('test@test.com');
      expect(result).toEqual(mockUser);
      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        email: 'test@test.com',
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

  describe('countAdmins', () => {
    it('should return the number of admins', async () => {
      mockUserModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(2),
      });

      const result = await service.countAdmins();
      expect(result).toBe(2);
      expect(mockUserModel.countDocuments).toHaveBeenCalledWith({
        role: Role.ADMIN,
      });
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
      expect(result.data).toEqual(users);
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
