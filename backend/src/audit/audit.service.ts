import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(event: {
    type: string;
    actorUserId?: string;
    remoteSessionId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await this.prisma.auditEvent.create({
      data: {
        type: event.type,
        actorUserId: event.actorUserId,
        remoteSessionId: event.remoteSessionId,
        metadata: event.metadata,
      },
    });
  }
}
