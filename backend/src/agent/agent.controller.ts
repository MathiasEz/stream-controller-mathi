import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AgentHeartbeatDto } from './dto/agent-heartbeat.dto';
import { AgentService } from './agent.service';
import { CommandResultDto } from './dto/command-result.dto';

@Controller('agent')
@UseGuards(JwtAuthGuard)
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Post('heartbeat')
  heartbeat(@Body() dto: AgentHeartbeatDto) {
    return this.agentService.heartbeat(dto);
  }

  @Post('command-result')
  commandResult(@Body() dto: CommandResultDto) {
    return this.agentService.reportCommandResult(dto);
  }
}
