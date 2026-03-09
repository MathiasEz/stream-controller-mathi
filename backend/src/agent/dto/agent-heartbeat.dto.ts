import { IsEnum, IsString, IsUUID, MaxLength } from 'class-validator';

enum AgentStatusDto {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
}

export class AgentHeartbeatDto {
  @IsUUID()
  streamerProfileId!: string;

  @IsString()
  @MaxLength(32)
  agentVersion!: string;

  @IsEnum(AgentStatusDto)
  status!: AgentStatusDto;
}
