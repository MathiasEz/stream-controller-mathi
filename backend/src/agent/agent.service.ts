import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class AgentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  async heartbeat(dto: { streamerProfileId: string; agentVersion: string; status: 'ONLINE' | 'OFFLINE' }) {
    const profile = await this.prisma.streamerProfile.findUnique({ where: { id: dto.streamerProfileId } });
    if (!profile) throw new NotFoundException('Streamer profile not found');

    const connection = await this.prisma.agentConnection.create({
      data: {
        streamerId: dto.streamerProfileId,
        status: dto.status,
        agentVersion: dto.agentVersion,
        heartbeatAt: new Date(),
      },
    });

    this.realtimeGateway.emitToStreamer(profile.userId, 'agent:heartbeat', {
      status: connection.status,
      heartbeatAt: connection.heartbeatAt,
    });

    await this.auditService.record({
      type: 'agent.heartbeat',
      actorUserId: profile.userId,
      metadata: { status: dto.status, agentVersion: dto.agentVersion },
    });

    return connection;
  }

  async reportCommandResult(dto: { commandId: string; status: 'EXECUTED' | 'FAILED'; errorMessage?: string }) {
    const command = await this.prisma.commandLog.findUnique({ where: { id: dto.commandId } });
    if (!command) throw new NotFoundException('Command not found');

    const updated = await this.prisma.commandLog.update({
      where: { id: dto.commandId },
      data: {
        status: dto.status,
        errorMessage: dto.errorMessage,
        executedAt: new Date(),
      },
    });

    this.realtimeGateway.emitToStreamer(updated.streamerId, 'command:result', {
      commandId: updated.id,
      status: updated.status,
      errorMessage: updated.errorMessage,
    });

    await this.auditService.record({
      type: 'command.result',
      actorUserId: updated.operatorId,
      remoteSessionId: updated.remoteSessionId,
      metadata: { commandId: updated.id, status: updated.status },
    });

    return updated;
  }
}
