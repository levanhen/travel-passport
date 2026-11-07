import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { ParticipationLevel, QrMode, SiteCategory, SiteStatus } from '@tp/db';

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class CreateAdminSiteDto {
  @IsEnum(ParticipationLevel)
  participationLevel!: ParticipationLevel;

  @IsUUID()
  destinationId!: string;

  @IsString()
  @MaxLength(200)
  name!: string;

  @IsString()
  @Matches(SLUG_RE, { message: 'slug không hợp lệ.' })
  slug!: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @IsEnum(SiteCategory)
  category!: SiteCategory;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(500)
  geofenceRadiusMeters?: number;

  @ValidateIf((o: CreateAdminSiteDto) => o.participationLevel === ParticipationLevel.catalog)
  @IsOptional()
  @IsBoolean()
  staticQrEnabled?: boolean;

  @ValidateIf((o: CreateAdminSiteDto) => o.participationLevel === ParticipationLevel.partner)
  @IsUUID()
  organizationId?: string;

  @ValidateIf((o: CreateAdminSiteDto) => o.participationLevel === ParticipationLevel.partner)
  @IsEnum(QrMode)
  qrMode?: QrMode;

  @IsOptional()
  @IsEnum(SiteStatus)
  status?: SiteStatus;
}

export class PatchAdminSiteDto {
  @IsOptional()
  @IsEnum(ParticipationLevel)
  participationLevel?: ParticipationLevel;

  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @IsOptional()
  @IsEnum(QrMode)
  qrMode?: QrMode;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(SLUG_RE, { message: 'slug không hợp lệ.' })
  slug?: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsOptional()
  @IsEnum(SiteCategory)
  category?: SiteCategory;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(500)
  geofenceRadiusMeters?: number;

  @IsOptional()
  @IsBoolean()
  staticQrEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  checkInEnabled?: boolean;

  @IsOptional()
  @IsEnum(SiteStatus)
  status?: SiteStatus;
}
