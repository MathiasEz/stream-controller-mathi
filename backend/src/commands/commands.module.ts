import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { CommandsController } from './commands.controller';
import { CommandsService } from './commands.service';

@Module({
  imports: [PermissionsModule, AuditModule, RealtimeModule],
  controllers: [CommandsController],
  providers: [CommandsService],
})
export class CommandsModule {}
