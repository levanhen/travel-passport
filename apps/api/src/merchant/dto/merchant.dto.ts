import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { TouristLevel, VoucherStatus } from '@tp/db';

export class CreateMerchantVoucherDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  discountLabel!: string;

  @IsOptional()
  @IsUUID()
  destinationId?: string;

  @IsOptional()
  @IsEnum(TouristLevel)
  minLevel?: TouristLevel;

  @IsOptional()
  @IsInt()
  @Min(0)
  minBalance?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  costPoints?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  quotaTotal?: number;

  @IsDateString()
  validFrom!: string;

  @IsDateString()
  validUntil!: string;
}

export class PatchMerchantVoucherDto {
  @IsOptional()
  @IsEnum(VoucherStatus)
  status?: VoucherStatus;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class RedeemClaimDto {
  @IsString()
  claimCode!: string;
}

export class CreateMerchantStaffDto {
  @IsString()
  email!: string;

  @IsString()
  password!: string;

  @IsOptional()
  @IsString()
  displayName?: string;
}

export class PatchMerchantBusinessDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;
}
