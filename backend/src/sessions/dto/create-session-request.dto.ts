import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateSessionRequestDto {
  @IsUUID()
  streamerId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  reason?: string;
}
