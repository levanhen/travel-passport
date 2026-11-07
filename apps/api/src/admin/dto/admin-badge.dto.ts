import {
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Min,
} from 'class-validator';
import { BadgeCriteriaType, BadgeStatus } from '@tp/db';

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class CreateAdminBadgeDto {
  @Matches(SLUG_RE)
  slug!: string;

  @IsString()
  name!: string;

  @IsString()
  description!: string;

  @IsOptional()
  @IsUUID()
  destinationId?: string;

  @IsEnum(BadgeCriteriaType)
  criteriaType!: BadgeCriteriaType;

  @IsObject()
  criteria!: Record<string, unknown>;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class PatchAdminBadgeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(BadgeStatus)
  status?: BadgeStatus;

  @IsOptional()
  @IsObject()
  criteria?: Record<string, unknown>;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
