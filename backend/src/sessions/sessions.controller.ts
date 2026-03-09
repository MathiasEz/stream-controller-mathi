import { Body, Controller, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { CreateSessionRequestDto } from './dto/create-session-request.dto';
import { SessionsService } from './sessions.service';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post('request')
  @Roles(Role.OPERATOR, Role.ADMIN)
  createRequest(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateSessionRequestDto) {
    return this.sessionsService.createRequest(user.sub, dto);
  }

  @Patch(':sessionId/approve')
  @Roles(Role.STREAMER, Role.ADMIN)
  approve(@CurrentUser() user: AuthenticatedUser, @Param('sessionId') sessionId: string) {
    return this.sessionsService.approve(user.sub, sessionId);
  }

  @Patch(':sessionId/reject')
  @Roles(Role.STREAMER, Role.ADMIN)
  reject(@CurrentUser() user: AuthenticatedUser, @Param('sessionId') sessionId: string) {
    return this.sessionsService.reject(user.sub, sessionId);
  }

  @Patch(':sessionId/close')
  @Roles(Role.OPERATOR, Role.ADMIN)
  close(@CurrentUser() user: AuthenticatedUser, @Param('sessionId') sessionId: string) {
    return this.sessionsService.closeByOperator(user.sub, sessionId);
  }

  @Patch(':sessionId/emergency-stop')
  @Roles(Role.STREAMER, Role.ADMIN)
  emergencyStop(@CurrentUser() user: AuthenticatedUser, @Param('sessionId') sessionId: string) {
    return this.sessionsService.emergencyStop(user.sub, sessionId);
  }
}
