import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PermissionsService } from './permissions.service';

describe('PermissionsService', () => {
  const prisma = {
    user: { findUnique: jest.fn() },
    operatorPermission: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const audit = { record: jest.fn() };

  const service = new PermissionsService(prisma as never, audit as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('grants permissions for valid operator', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'operator-1' });
    prisma.operatorPermission.upsert.mockResolvedValue({ id: 'perm-1' });

    const result = await service.grant('streamer-1', {
      operatorId: 'operator-1',
      actions: ['OBS_SCENE_SWITCH'],
    });

    expect(result).toEqual({ id: 'perm-1' });
    expect(audit.record).toHaveBeenCalled();
  });

  it('fails when operator does not exist', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      service.grant('streamer-1', { operatorId: 'missing', actions: ['OBS_SCENE_SWITCH'] }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects unauthorized action usage', async () => {
    prisma.operatorPermission.findUnique.mockResolvedValue({
      actions: ['OBS_SCENE_SWITCH'],
      revokedAt: null,
      expiresAt: null,
    });

    await expect(service.requireAction('streamer-1', 'operator-1', 'OBS_AUDIO_MUTE')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
