import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { Role } from '../users/schemas/user.schema';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: Partial<UsersService>;
  let jwtService: Partial<JwtService>;

  beforeEach(async () => {
    usersService = {
      create: jest.fn().mockResolvedValue({
        _id: '123',
        email: 'test@test.com',
        role: Role.GUEST,
      }),
      findByEmail: jest.fn(),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('fake-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should create a user with GUEST role', async () => {
      const result = await service.register('test@test.com', '123456');
      expect(usersService.create).toHaveBeenCalledWith(
        'test@test.com',
        '123456',
        Role.GUEST,
      );
      expect(result.email).toBe('test@test.com');
      expect(result.role).toBe(Role.GUEST);
    });
  });

  describe('login', () => {
    it('should return a token with valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('123456', 10);
      (usersService.findByEmail as jest.Mock).mockResolvedValue({
        _id: '123',
        email: 'test@test.com',
        password: hashedPassword,
        role: Role.GUEST,
      });

      const result = await service.login('test@test.com', '123456');
      expect(result.access_token).toBe('fake-token');
    });

    it('should throw if user not found', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue(null);

      await expect(
        service.login('noexiste@test.com', '123456'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw if password is wrong', async () => {
      const hashedPassword = await bcrypt.hash('123456', 10);
      (usersService.findByEmail as jest.Mock).mockResolvedValue({
        _id: '123',
        email: 'test@test.com',
        password: hashedPassword,
        role: Role.GUEST,
      });

      await expect(
        service.login('test@test.com', 'incorrecta'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
