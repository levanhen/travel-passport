import {
  IsEmail,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MerchantCategory, MerchantStatus } from '@tp/db';

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class AdminMerchantInfoDto {
  @IsString()
  name!: string;

  @Matches(SLUG_RE)
  slug!: string;

  @IsEnum(MerchantCategory)
  category!: MerchantCategory;

  @IsOptional()
  @IsString()
  address?: string;
}

export class AdminMerchantOwnerDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

export class CreateAdminMerchantDto {
  @IsString()
  organizationName!: string;

  @IsUUID()
  destinationId!: string;

  @ValidateNested()
  @Type(() => AdminMerchantInfoDto)
  merchant!: AdminMerchantInfoDto;

  @ValidateNested()
  @Type(() => AdminMerchantOwnerDto)
  owner!: AdminMerchantOwnerDto;
}

export class PatchAdminMerchantDto {
  @IsOptional()
  @IsEnum(MerchantStatus)
  status?: MerchantStatus;
}
