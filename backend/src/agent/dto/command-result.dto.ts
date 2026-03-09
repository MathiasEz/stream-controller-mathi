import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

enum CommandResultStatus {
  EXECUTED = 'EXECUTED',
  FAILED = 'FAILED',
}

export class CommandResultDto {
  @IsUUID()
  commandId!: string;

  @IsEnum(CommandResultStatus)
  status!: CommandResultStatus;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  errorMessage?: string;
}
