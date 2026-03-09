import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { Role } from '../common/enums/role.enum';
import { AuthService } from './auth.service';

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn(),
}));

const bcrypt = jest.requireMock('bcryptjs') as { compare: jest.Mock };

describe('AuthService', () => {
  const usersService = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
  };

  const jwtService = {
    signAsync: jest.fn(),
  };

  const configService = {
    getOrThrow: jest.fn((key: string) => `${key}_value`),
  };

  const auditService = {
    record: jest.fn(),
  };

  const prisma = {
    streamerProfile: { create: jest.fn() },
    refreshToken: { findUnique: jest.fn() },
    $transaction: jest.fn(),
  };

  const service = new AuthService(
    usersService as never,
    jwtService as never,
    configService as never,
    auditService as never,
    prisma as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    jwtService.signAsync.mockResolvedValueOnce('access').mockResolvedValueOnce('refresh');
    prisma.$transaction.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => {
      await cb({ refreshToken: { updateMany: jest.fn(), create: jest.fn() } });
    });
  });

  it('registers new streamer and creates streamer profile', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    usersService.create.mockResolvedValue({
      id: 'u1',
      email: 's@test.com',
      role: 'STREAMER',
    });

    const result = await service.register({
      email: 's@test.com',
      displayName: 's',
      password: 'password123',
      role: Role.STREAMER,
    });

    expect(prisma.streamerProfile.create).toHaveBeenCalledWith({ data: { userId: 'u1' } });
    expect(result).toEqual({ accessToken: 'access', refreshToken: 'refresh' });
  });

  it('throws on duplicate email', async () => {
    usersService.findByEmail.mockResolvedValue({ id: 'exists' });

    await expect(
      service.register({
        email: 'taken@test.com',
        displayName: 'x',
        password: 'password123',
        role: Role.OPERATOR,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws unauthorized on wrong password', async () => {
    usersService.findByEmail.mockResolvedValue({ id: 'u2', passwordHash: 'hash', role: 'OPERATOR' });
    bcrypt.compare.mockResolvedValue(false);

    await expect(service.login({ email: 'o@test.com', password: 'badpassword' })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
