import { IsISO8601, IsObject, IsOptional, IsString, IsUUID, Matches, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ConsentDto {
  @IsString()
  termsVersion!: string;

  @IsString()
  privacyVersion!: string;

  @IsISO8601()
  acceptedAt!: string;
}

export class TouristStartDto {
  @IsString()
  phone!: string;

  @IsUUID()
  deviceId!: string;
}

export class TouristSetPinDto {
  @IsString()
  phone!: string;

  @IsUUID()
  deviceId!: string;

  @Matches(/^\d{6}$/)
  pin!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ConsentDto)
  @IsObject()
  consent?: ConsentDto;
}

export class TouristUnlockDto {
  @IsString()
  phone!: string;

  @IsUUID()
  deviceId!: string;

  @Matches(/^\d{6}$/)
  pin!: string;
}

export class TouristChangePinDto {
  @Matches(/^\d{6}$/)
  oldPin!: string;

  @Matches(/^\d{6}$/)
  newPin!: string;
}
