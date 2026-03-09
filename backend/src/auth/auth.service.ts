import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
    private readonly prisma: PrismaService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already in use');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.usersService.create({
      email: dto.email,
      displayName: dto.displayName,
      passwordHash,
      role: dto.role as Role,
    });

    if (user.role === 'STREAMER') {
      await this.prisma.streamerProfile.create({ data: { userId: user.id } });
    }

    await this.auditService.record({ type: 'auth.register', actorUserId: user.id });
    return this.generateTokens(user.id, user.email, user.role);
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) throw new UnauthorizedException('Invalid credentials');

    await this.auditService.record({ type: 'auth.login', actorUserId: user.id });
    return this.generateTokens(user.id, user.email, user.role);
  }

  async refresh(refreshToken: string) {
    const token = await this.prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!token || token.revokedAt || token.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.usersService.findById(token.userId);
    if (!user) throw new UnauthorizedException('Invalid refresh token');

    return this.generateTokens(user.id, user.email, user.role, refreshToken);
  }

  private async generateTokens(userId: string, email: string, role: Role, previousToken?: string) {
    const payload = { sub: userId, email, role };
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '15m',
      secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: '30d',
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
    });

    await this.prisma.$transaction(async (tx) => {
      if (previousToken) {
        await tx.refreshToken.updateMany({
          where: { token: previousToken, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }
      await tx.refreshToken.create({
        data: {
          token: refreshToken,
          userId,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
        },
      });
    });

    return { accessToken, refreshToken };
  }
}
