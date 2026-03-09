import { NotFoundException } from '@nestjs/common';
import { SessionsService } from './sessions.service';

describe('SessionsService', () => {
  const prisma = {
    remoteSession: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };
  const audit = { record: jest.fn() };
  const realtime = { emitToStreamer: jest.fn() };

  const service = new SessionsService(prisma as never, audit as never, realtime as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a request session', async () => {
    prisma.remoteSession.create.mockResolvedValue({ id: 's1', status: 'REQUESTED' });

    const result = await service.createRequest('op1', { streamerId: 'st1', reason: 'assist' });

    expect(result.status).toBe('REQUESTED');
    expect(audit.record).toHaveBeenCalled();
  });

  it('approves streamer-owned session', async () => {
    prisma.remoteSession.findUnique.mockResolvedValue({ id: 's1', streamerId: 'st1' });
    prisma.remoteSession.update.mockResolvedValue({ id: 's1', status: 'ACTIVE' });

    const result = await service.approve('st1', 's1');

    expect(result.status).toBe('ACTIVE');
    expect(realtime.emitToStreamer).toHaveBeenCalled();
  });

  it('throws when streamer tries approving foreign session', async () => {
    prisma.remoteSession.findUnique.mockResolvedValue({ id: 's1', streamerId: 'other' });

    await expect(service.approve('st1', 's1')).rejects.toBeInstanceOf(NotFoundException);
  });
});
