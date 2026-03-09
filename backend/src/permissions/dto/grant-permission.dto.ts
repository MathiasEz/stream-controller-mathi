import { IsArray, IsDateString, IsOptional, IsUUID, ArrayNotEmpty, IsString } from 'class-validator';

export class GrantPermissionDto {
  @IsUUID()
  operatorId!: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  actions!: string[];

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
