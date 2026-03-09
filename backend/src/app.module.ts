import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { PermissionsModule } from './permissions/permissions.module';
import { SessionsModule } from './sessions/sessions.module';
import { CommandsModule } from './commands/commands.module';
import { AuditModule } from './audit/audit.module';
import { AgentModule } from './agent/agent.module';
import { RealtimeModule } from './realtime/realtime.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    RealtimeModule,
    AuditModule,
    UsersModule,
    AuthModule,
    PermissionsModule,
    SessionsModule,
    CommandsModule,
    AgentModule,
  ],
})
export class AppModule {}
