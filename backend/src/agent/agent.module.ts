import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';

@Module({
  imports: [AuditModule, RealtimeModule],
  controllers: [AgentController],
  providers: [AgentService],
})
export class AgentModule {}
