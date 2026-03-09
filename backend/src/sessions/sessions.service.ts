import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class SessionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  async createRequest(operatorId: string, dto: { streamerId: string; reason?: string }) {
    const session = await this.prisma.remoteSession.create({
      data: {
        operatorId,
        streamerId: dto.streamerId,
        status: 'REQUESTED',
        requestedAt: new Date(),
        reason: dto.reason,
      },
    });

    await this.auditService.record({
      type: 'session.requested',
      actorUserId: operatorId,
      remoteSessionId: session.id,
    });

    return session;
  }

  async approve(streamerId: string, sessionId: string) {
    const session = await this.prisma.remoteSession.findUnique({ where: { id: sessionId } });
    if (!session || session.streamerId !== streamerId) throw new NotFoundException('Session not found');

    const updated = await this.prisma.remoteSession.update({
      where: { id: sessionId },
      data: { status: 'ACTIVE', approvedAt: new Date(), startedAt: new Date() },
    });

    this.realtimeGateway.emitToStreamer(streamerId, 'session:approved', { sessionId: updated.id });
    await this.auditService.record({
      type: 'session.approved',
      actorUserId: streamerId,
      remoteSessionId: sessionId,
    });

    return updated;
  }

  async reject(streamerId: string, sessionId: string) {
    const session = await this.prisma.remoteSession.findUnique({ where: { id: sessionId } });
    if (!session || session.streamerId !== streamerId) throw new NotFoundException('Session not found');

    const updated = await this.prisma.remoteSession.update({
      where: { id: sessionId },
      data: { status: 'REJECTED', endedAt: new Date() },
    });

    await this.auditService.record({
      type: 'session.rejected',
      actorUserId: streamerId,
      remoteSessionId: sessionId,
    });

    return updated;
  }

  async closeByOperator(operatorId: string, sessionId: string) {
    const session = await this.prisma.remoteSession.findUnique({ where: { id: sessionId } });
    if (!session || session.operatorId !== operatorId) throw new NotFoundException('Session not found');

    const updated = await this.prisma.remoteSession.update({
      where: { id: sessionId },
      data: { status: 'CLOSED', endedAt: new Date() },
    });

    await this.auditService.record({
      type: 'session.closed',
      actorUserId: operatorId,
      remoteSessionId: sessionId,
    });

    return updated;
  }

  async emergencyStop(streamerId: string, sessionId: string) {
    const session = await this.prisma.remoteSession.findUnique({ where: { id: sessionId } });
    if (!session || session.streamerId !== streamerId) throw new NotFoundException('Session not found');

    const updated = await this.prisma.remoteSession.update({
      where: { id: sessionId },
      data: { status: 'EMERGENCY_STOPPED', endedAt: new Date() },
    });

    this.realtimeGateway.emitToStreamer(streamerId, 'session:emergency_stop', { sessionId });
    await this.auditService.record({
      type: 'session.emergency_stop',
      actorUserId: streamerId,
      remoteSessionId: sessionId,
    });

    return updated;
  }
}
