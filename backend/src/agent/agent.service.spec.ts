import { NotFoundException } from '@nestjs/common';
import { AgentService } from './agent.service';

describe('AgentService', () => {
  const prisma = {
    streamerProfile: { findUnique: jest.fn() },
    agentConnection: { create: jest.fn() },
    commandLog: { findUnique: jest.fn(), update: jest.fn() },
  };
  const audit = { record: jest.fn() };
  const realtime = { emitToStreamer: jest.fn() };

  const service = new AgentService(prisma as never, audit as never, realtime as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('stores heartbeat and emits status', async () => {
    prisma.streamerProfile.findUnique.mockResolvedValue({ id: 'sp1', userId: 'u1' });
    prisma.agentConnection.create.mockResolvedValue({ status: 'ONLINE', heartbeatAt: new Date() });

    const result = await service.heartbeat({
      streamerProfileId: 'sp1',
      agentVersion: '1.0.0',
      status: 'ONLINE',
    });

    expect(result.status).toBe('ONLINE');
    expect(realtime.emitToStreamer).toHaveBeenCalled();
  });

  it('fails heartbeat when streamer profile not found', async () => {
    prisma.streamerProfile.findUnique.mockResolvedValue(null);

    await expect(
      service.heartbeat({ streamerProfileId: 'missing', agentVersion: '1.0.0', status: 'ONLINE' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
