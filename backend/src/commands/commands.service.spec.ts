import { NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { CommandsService } from './commands.service';

describe('CommandsService', () => {
  const prisma = {
    remoteSession: { findUnique: jest.fn() },
    streamerProfile: { findUnique: jest.fn() },
    agentConnection: { findFirst: jest.fn() },
    commandLog: { create: jest.fn() },
  };
  const permissions = { requireAction: jest.fn() };
  const audit = { record: jest.fn() };
  const realtime = { emitToStreamer: jest.fn() };

  const service = new CommandsService(
    prisma as never,
    permissions as never,
    audit as never,
    realtime as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('queues command when active session, permission, and agent online', async () => {
    prisma.remoteSession.findUnique.mockResolvedValue({
      id: 'rs1',
      operatorId: 'op1',
      streamerId: 'st1',
      status: 'ACTIVE',
    });
    prisma.streamerProfile.findUnique.mockResolvedValue({ id: 'profile-1' });
    prisma.agentConnection.findFirst.mockResolvedValue({ id: 'ac1', status: 'ONLINE' });
    prisma.commandLog.create.mockResolvedValue({ id: 'c1' });

    const result = await service.send('op1', {
      sessionId: 'rs1',
      action: 'OBS_SCENE_SWITCH',
      payload: { scene: 'live' },
    });

    expect(result.commandId).toBe('c1');
    expect(permissions.requireAction).toHaveBeenCalled();
  });

  it('throws when active session not found', async () => {
    prisma.remoteSession.findUnique.mockResolvedValue(null);

    await expect(
      service.send('op1', { sessionId: 'bad', action: 'OBS_SCENE_SWITCH', payload: {} }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws when agent is offline', async () => {
    prisma.remoteSession.findUnique.mockResolvedValue({
      id: 'rs1',
      operatorId: 'op1',
      streamerId: 'st1',
      status: 'ACTIVE',
    });
    prisma.streamerProfile.findUnique.mockResolvedValue({ id: 'profile-1' });
    prisma.agentConnection.findFirst.mockResolvedValue(null);

    await expect(
      service.send('op1', { sessionId: 'rs1', action: 'OBS_SCENE_SWITCH', payload: {} }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
