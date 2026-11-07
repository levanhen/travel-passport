import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreateSelfCheckinDto {
  @IsUUID()
  siteId!: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  accuracyMeters?: number;

  @IsString()
  deviceId!: string;

  @IsOptional()
  @IsString()
  qrToken?: string | null;

  @IsOptional()
  @IsBoolean()
  includePhoto?: boolean;
}

export class CreatePartnerCheckinDto extends CreateSelfCheckinDto {}

export class AddQrEvidenceDto {
  @IsString()
  type!: 'qr';

  @IsOptional()
  @IsString()
  qrToken?: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @IsString()
  deviceId!: string;
}
