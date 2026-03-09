import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PermissionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async grant(streamerId: string, dto: { operatorId: string; actions: string[]; expiresAt?: string }) {
    const operator = await this.prisma.user.findUnique({ where: { id: dto.operatorId } });
    if (!operator) throw new NotFoundException('Operator not found');

    const permission = await this.prisma.operatorPermission.upsert({
      where: { streamerId_operatorId: { streamerId, operatorId: dto.operatorId } },
      update: {
        actions: dto.actions,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        revokedAt: null,
      },
      create: {
        streamerId,
        operatorId: dto.operatorId,
        actions: dto.actions,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });

    await this.auditService.record({
      type: 'permission.granted',
      actorUserId: streamerId,
      metadata: { operatorId: dto.operatorId, actions: dto.actions },
    });

    return permission;
  }

  async revoke(streamerId: string, operatorId: string) {
    const permission = await this.prisma.operatorPermission.findUnique({
      where: { streamerId_operatorId: { streamerId, operatorId } },
    });
    if (!permission) throw new NotFoundException('Permission not found');

    const revoked = await this.prisma.operatorPermission.update({
      where: { streamerId_operatorId: { streamerId, operatorId } },
      data: { revokedAt: new Date() },
    });

    await this.auditService.record({
      type: 'permission.revoked',
      actorUserId: streamerId,
      metadata: { operatorId },
    });

    return revoked;
  }

  async requireAction(streamerId: string, operatorId: string, action: string) {
    const permission = await this.prisma.operatorPermission.findUnique({
      where: { streamerId_operatorId: { streamerId, operatorId } },
    });

    const expired = permission?.expiresAt && permission.expiresAt < new Date();
    if (!permission || permission.revokedAt || expired || !permission.actions.includes(action)) {
      throw new ForbiddenException('Operator is not authorized for this action');
    }
  }
}
