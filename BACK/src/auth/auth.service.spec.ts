import { BadRequestException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Role } from '../common/enums';
import { AuthService, hashToken } from './auth.service';

describe('AuthService', () => {
  const userModel = {
    create: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
  };
  const users = { assertEmailFree: jest.fn(), findByEmail: jest.fn() };
  const jwt = { signAsync: jest.fn().mockResolvedValue('signed-token') } as unknown as JwtService;
  const mail = {
    send: jest.fn().mockResolvedValue(true),
    layout: jest.fn(() => ''),
    link: (p: string) => p,
  };

  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    userModel.find.mockReturnValue({ lean: () => Promise.resolve([{ email: 'admin@x.tn' }]) });
    service = new AuthService(userModel as any, users as any, jwt, mail as any);
  });

  const registration = {
    name: 'Parent',
    email: 'parent@x.tn',
    password: 'Secret123',
    phone: '123',
    availableFrom: '2024-06-04',
    availableTo: '2024-06-08',
  };

  describe('register', () => {
    it('always creates a pending, unverified parent with a hashed password', async () => {
      userModel.create.mockImplementation(async (data) => ({ ...data, _id: 'id1' }));
      // Extra fields are stripped by the ValidationPipe, but the role is forced anyway.
      await service.register({ ...registration, role: Role.SUPER_ADMIN } as any);

      const created = userModel.create.mock.calls[0][0];
      expect(created.role).toBe(Role.PARENT);
      expect(created.accountStatus).toBe(false);
      expect(created.emailVerified).toBe(false);
      expect(created.password).not.toBe('Secret123');
      expect(await bcrypt.compare('Secret123', created.password)).toBe(true);
      expect(created.emailVerificationToken).toHaveLength(64);
      // verification email to the parent + notification to the admin
      expect(mail.send).toHaveBeenCalledTimes(2);
    });

    it('rejects an availability range that ends before it starts', async () => {
      await expect(
        service.register({
          ...registration,
          availableFrom: '2024-06-08',
          availableTo: '2024-06-04',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(userModel.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const account = async (extra = {}) => ({
      _id: 'u1',
      role: Role.TEACHER,
      password: await bcrypt.hash('Secret123', 4),
      toJSON: () => ({ id: 'u1' }),
      ...extra,
    });

    it('returns a token for valid credentials', async () => {
      users.findByEmail.mockResolvedValue(await account());
      const result = await service.login({ email: 't@x.tn', password: 'Secret123' });
      expect(result).toEqual({ accessToken: 'signed-token', user: { id: 'u1' } });
      expect(jwt.signAsync).toHaveBeenCalledWith({ sub: 'u1', role: Role.TEACHER });
    });

    it('rejects a wrong password or unknown email with the same error', async () => {
      users.findByEmail.mockResolvedValue(await account());
      await expect(service.login({ email: 't@x.tn', password: 'wrong' })).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      users.findByEmail.mockResolvedValue(null);
      await expect(
        service.login({ email: 'no@x.tn', password: 'Secret123' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('refuses accounts whose email is not verified', async () => {
      users.findByEmail.mockResolvedValue(await account({ emailVerified: false }));
      await expect(
        service.login({ email: 't@x.tn', password: 'Secret123' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('verifyEmail', () => {
    it('looks the token up by its hash and marks the email verified', async () => {
      const user = { emailVerified: false, emailVerificationToken: 'h', save: jest.fn() };
      userModel.findOne.mockResolvedValue(user);
      await service.verifyEmail('plain-token');
      expect(userModel.findOne).toHaveBeenCalledWith({
        emailVerificationToken: hashToken('plain-token'),
      });
      expect(user.emailVerified).toBe(true);
      expect(user.emailVerificationToken).toBeUndefined();
      expect(user.save).toHaveBeenCalled();
    });
  });
});
