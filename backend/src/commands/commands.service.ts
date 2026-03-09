import { Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { PermissionsService } from '../permissions/permissions.service';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class CommandsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissionsService: PermissionsService,
    private readonly auditService: AuditService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  async send(operatorId: string, dto: { sessionId: string; action: string; payload: Record<string, unknown> }) {
    const session = await this.prisma.remoteSession.findUnique({ where: { id: dto.sessionId } });
    if (!session || session.operatorId !== operatorId || session.status !== 'ACTIVE') {
      throw new NotFoundException('Active session not found');
    }

    await this.permissionsService.requireAction(session.streamerId, operatorId, dto.action);

    const profile = await this.prisma.streamerProfile.findUnique({
      where: { userId: session.streamerId },
      select: { id: true },
    });

    if (!profile) throw new NotFoundException('Streamer profile not found');

    const connection = await this.prisma.agentConnection.findFirst({
      where: { streamerId: profile.id, status: 'ONLINE' },
      orderBy: { heartbeatAt: 'desc' },
    });

    if (!connection) throw new ServiceUnavailableException('Local agent is offline');

    const log = await this.prisma.commandLog.create({
      data: {
        remoteSessionId: session.id,
        streamerId: session.streamerId,
        operatorId,
        action: dto.action,
        payload: dto.payload,
        status: 'QUEUED',
      },
    });

    await this.auditService.record({
      type: 'command.queued',
      actorUserId: operatorId,
      remoteSessionId: session.id,
      metadata: { commandId: log.id, action: dto.action },
    });

    this.realtimeGateway.emitToStreamer(session.streamerId, 'command:queued', {
      commandId: log.id,
      action: dto.action,
    });

    return {
      commandId: log.id,
      status: 'QUEUED',
      message: 'Command queued for delivery to local agent',
    };
  }
}
