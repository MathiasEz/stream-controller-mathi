import { IsObject, IsString, IsUUID, MaxLength } from 'class-validator';

export class SendCommandDto {
  @IsUUID()
  sessionId!: string;

  @IsString()
  @MaxLength(120)
  action!: string;

  @IsObject()
  payload!: Record<string, unknown>;
}
