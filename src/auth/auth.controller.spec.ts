import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    register: jest.fn().mockResolvedValue({
      id: '123',
      email: 'test@test.com',
      role: 'GUEST',
    }),
    login: jest.fn().mockResolvedValue({
      access_token: 'fake-token',
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should call authService.register', async () => {
      const result = await controller.register({
        email: 'test@test.com',
        password: '123456',
      });
      expect(mockAuthService.register).toHaveBeenCalledWith(
        'test@test.com',
        '123456',
      );
      expect(result.email).toBe('test@test.com');
    });
  });

  describe('login', () => {
    it('should return an access token', async () => {
      const result = await controller.login({
        email: 'test@test.com',
        password: '123456',
      });
      expect(result.access_token).toBe('fake-token');
    });
  });
});
