-- AlterEnum / CreateEnums
CREATE TYPE "PhoneVerifiedVia" AS ENUM ('zalo', 'sms');
CREATE TYPE "TouristLevel" AS ENUM ('TRAVELLER', 'EXPLORER', 'LOCAL_INSIDER');
CREATE TYPE "OrganizationType" AS ENUM ('DESTINATION_OPERATOR', 'MERCHANT', 'AUTHORITY', 'PLATFORM');
CREATE TYPE "OrganizationStatus" AS ENUM ('active', 'disabled');
CREATE TYPE "DestinationStatus" AS ENUM ('draft', 'published', 'archived');
CREATE TYPE "ParticipationLevel" AS ENUM ('catalog', 'partner');
CREATE TYPE "SiteCategory" AS ENUM ('HERITAGE', 'BEACH', 'NATURE', 'MOUNTAIN', 'ISLAND', 'CULTURAL', 'FOOD', 'OTHER');
CREATE TYPE "SiteStatus" AS ENUM ('draft', 'published', 'archived');
CREATE TYPE "QrMode" AS ENUM ('rotating', 'static');
CREATE TYPE "CheckinStatus" AS ENUM ('confirmed', 'void');
CREATE TYPE "ProofLevel" AS ENUM ('L0', 'L1', 'L2');
CREATE TYPE "EvidenceType" AS ENUM ('gps', 'qr', 'photo');
CREATE TYPE "PointTxnType" AS ENUM ('CHECKIN_AWARD', 'CHECKIN_EVIDENCE_BONUS', 'VOUCHER_CLAIM', 'ADMIN_ADJUST');
CREATE TYPE "BadgeCriteriaType" AS ENUM ('CHECKIN_COUNT', 'FIRST_CHECKIN');
CREATE TYPE "BadgeStatus" AS ENUM ('draft', 'published', 'archived');
CREATE TYPE "MerchantCategory" AS ENUM ('RESTAURANT', 'CAFE', 'HOTEL', 'TOUR', 'TRANSPORT', 'EXPERIENCE', 'OTHER');
CREATE TYPE "MerchantStatus" AS ENUM ('draft', 'active', 'suspended');
CREATE TYPE "VoucherStatus" AS ENUM ('draft', 'issued', 'cancelled');
CREATE TYPE "VoucherClaimStatus" AS ENUM ('active', 'redeemed', 'expired', 'cancelled');

-- AlterTable users
ALTER TABLE "users" ADD COLUMN "phone_verified_via" "PhoneVerifiedVia";
ALTER TABLE "users" ALTER COLUMN "pin_locked_until" TYPE TIMESTAMPTZ(6);
ALTER TABLE "users" ALTER COLUMN "phone_verified_at" TYPE TIMESTAMPTZ(6);
ALTER TABLE "users" ALTER COLUMN "last_login_at" TYPE TIMESTAMPTZ(6);
ALTER TABLE "users" ALTER COLUMN "created_at" TYPE TIMESTAMPTZ(6);
ALTER TABLE "users" ALTER COLUMN "updated_at" TYPE TIMESTAMPTZ(6);
ALTER TABLE "users" ALTER COLUMN "deleted_at" TYPE TIMESTAMPTZ(6);

-- AlterTable tourist_profiles
ALTER TABLE "tourist_profiles" ADD COLUMN "bio" TEXT;
ALTER TABLE "tourist_profiles" ADD COLUMN "avatar_object_key" TEXT;
ALTER TABLE "tourist_profiles" ALTER COLUMN "created_at" TYPE TIMESTAMPTZ(6);
ALTER TABLE "tourist_profiles" ALTER COLUMN "updated_at" TYPE TIMESTAMPTZ(6);
-- migrate level TEXT -> enum
ALTER TABLE "tourist_profiles" ALTER COLUMN "level" DROP DEFAULT;
ALTER TABLE "tourist_profiles" ALTER COLUMN "level" TYPE "TouristLevel" USING ("level"::"TouristLevel");
ALTER TABLE "tourist_profiles" ALTER COLUMN "level" SET DEFAULT 'TRAVELLER'::"TouristLevel";

-- Fix FK cascade
ALTER TABLE "tourist_profiles" DROP CONSTRAINT "tourist_profiles_user_id_fkey";
ALTER TABLE "tourist_profiles" ADD CONSTRAINT "tourist_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable device_bindings
CREATE TABLE "device_bindings" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "device_id_hash" TEXT NOT NULL,
    "label" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "device_bindings_pkey" PRIMARY KEY ("id")
);

-- CreateTable refresh_tokens
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "device_id_hash" TEXT,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable memberships
CREATE TABLE "memberships" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "role" "UserRole" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable user_consents
CREATE TABLE "user_consents" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "terms_version" TEXT NOT NULL,
    "privacy_version" TEXT NOT NULL,
    "accepted_at" TIMESTAMPTZ(6) NOT NULL,
    "ip" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable otp_challenges
CREATE TABLE "otp_challenges" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "phone" TEXT,
    "channel" TEXT NOT NULL DEFAULT 'sms',
    "code_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "consumed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "otp_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable organizations
CREATE TABLE "organizations" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "type" "OrganizationType" NOT NULL,
    "status" "OrganizationStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable destinations
CREATE TABLE "destinations" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "cover_object_key" TEXT,
    "status" "DestinationStatus" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "destinations_pkey" PRIMARY KEY ("id")
);

-- CreateTable tourism_sites
CREATE TABLE "tourism_sites" (
    "id" UUID NOT NULL,
    "destination_id" UUID NOT NULL,
    "organization_id" UUID,
    "participation_level" "ParticipationLevel" NOT NULL DEFAULT 'catalog',
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT,
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "geofence_radius_meters" INTEGER NOT NULL,
    "category" "SiteCategory" NOT NULL,
    "status" "SiteStatus" NOT NULL DEFAULT 'draft',
    "check_in_enabled" BOOLEAN NOT NULL DEFAULT true,
    "qr_mode" "QrMode",
    "static_qr_enabled" BOOLEAN NOT NULL DEFAULT false,
    "cover_object_key" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),
    CONSTRAINT "tourism_sites_pkey" PRIMARY KEY ("id")
);

-- CreateTable checkins
CREATE TABLE "checkins" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "tourism_site_id" UUID NOT NULL,
    "destination_id" UUID NOT NULL,
    "participation_level" "ParticipationLevel" NOT NULL,
    "proof_level" "ProofLevel" NOT NULL DEFAULT 'L0',
    "evidence_flags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "points_awarded" INTEGER NOT NULL DEFAULT 0,
    "status" "CheckinStatus" NOT NULL DEFAULT 'confirmed',
    "void_reason" TEXT,
    "voided_at" TIMESTAMPTZ(6),
    "voided_by_user_id" UUID,
    "checked_in_at" TIMESTAMPTZ(6) NOT NULL,
    "upgrade_expires_at" TIMESTAMPTZ(6) NOT NULL,
    "local_date" DATE NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "checkins_pkey" PRIMARY KEY ("id")
);

-- CreateTable checkin_evidences
CREATE TABLE "checkin_evidences" (
    "id" UUID NOT NULL,
    "checkin_id" UUID NOT NULL,
    "type" "EvidenceType" NOT NULL,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "accuracy_meters" INTEGER,
    "distance_meters" DECIMAL(10,2),
    "within_geofence" BOOLEAN,
    "qr_mode" "QrMode",
    "qr_token_hash" TEXT,
    "photo_object_key" TEXT,
    "device_id_hash" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "checkin_evidences_pkey" PRIMARY KEY ("id")
);

-- CreateTable checkin_proofs
CREATE TABLE "checkin_proofs" (
    "checkin_id" UUID NOT NULL,
    "proof_level" "ProofLevel" NOT NULL,
    "evidence_flags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "accuracy_meters" INTEGER,
    "qr_mode" "QrMode",
    "device_id_hash" TEXT,
    "ip" TEXT,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "checkin_proofs_pkey" PRIMARY KEY ("checkin_id")
);

-- CreateTable point_transactions
CREATE TABLE "point_transactions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" "PointTxnType" NOT NULL,
    "checkin_id" UUID,
    "award_checkin_id" UUID,
    "evidence_type" "EvidenceType",
    "voucher_claim_id" UUID,
    "proof_level" "ProofLevel",
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "point_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable badges
CREATE TABLE "badges" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon_object_key" TEXT,
    "destination_id" UUID,
    "issuer_organization_id" UUID,
    "criteria_type" "BadgeCriteriaType" NOT NULL,
    "criteria" JSONB NOT NULL,
    "status" "BadgeStatus" NOT NULL DEFAULT 'draft',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable user_badges
CREATE TABLE "user_badges" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "badge_id" UUID NOT NULL,
    "awarded_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trigger_checkin_id" UUID,
    CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable merchants
CREATE TABLE "merchants" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "destination_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" "MerchantCategory" NOT NULL,
    "description" TEXT,
    "address" TEXT,
    "contact_phone" TEXT,
    "logo_object_key" TEXT,
    "status" "MerchantStatus" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "merchants_pkey" PRIMARY KEY ("id")
);

-- CreateTable vouchers
CREATE TABLE "vouchers" (
    "id" UUID NOT NULL,
    "merchant_id" UUID NOT NULL,
    "destination_id" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "discount_label" TEXT NOT NULL,
    "min_level" "TouristLevel" NOT NULL DEFAULT 'TRAVELLER',
    "min_balance" INTEGER NOT NULL DEFAULT 0,
    "cost_points" INTEGER NOT NULL DEFAULT 0,
    "quota_total" INTEGER,
    "quota_claimed" INTEGER NOT NULL DEFAULT 0,
    "valid_from" TIMESTAMPTZ(6) NOT NULL,
    "valid_until" TIMESTAMPTZ(6) NOT NULL,
    "status" "VoucherStatus" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),
    CONSTRAINT "vouchers_pkey" PRIMARY KEY ("id")
);

-- CreateTable voucher_claims
CREATE TABLE "voucher_claims" (
    "id" UUID NOT NULL,
    "voucher_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "claim_code" TEXT NOT NULL,
    "status" "VoucherClaimStatus" NOT NULL DEFAULT 'active',
    "claimed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "redeemed_at" TIMESTAMPTZ(6),
    CONSTRAINT "voucher_claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable voucher_redemptions
CREATE TABLE "voucher_redemptions" (
    "id" UUID NOT NULL,
    "voucher_claim_id" UUID NOT NULL,
    "merchant_staff_user_id" UUID NOT NULL,
    "redeemed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "voucher_redemptions_pkey" PRIMARY KEY ("id")
);

-- Indexes / Uniques
CREATE UNIQUE INDEX "device_bindings_user_id_device_id_hash_key" ON "device_bindings"("user_id", "device_id_hash");
CREATE INDEX "device_bindings_user_id_idx" ON "device_bindings"("user_id");

CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

CREATE UNIQUE INDEX "memberships_user_id_organization_id_key" ON "memberships"("user_id", "organization_id");
CREATE INDEX "memberships_organization_id_idx" ON "memberships"("organization_id");

CREATE INDEX "user_consents_user_id_idx" ON "user_consents"("user_id");
CREATE INDEX "otp_challenges_phone_idx" ON "otp_challenges"("phone");

CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");
CREATE INDEX "organizations_type_status_idx" ON "organizations"("type", "status");

CREATE UNIQUE INDEX "destinations_slug_key" ON "destinations"("slug");

CREATE UNIQUE INDEX "tourism_sites_destination_id_slug_key" ON "tourism_sites"("destination_id", "slug");
CREATE INDEX "tourism_sites_destination_id_status_idx" ON "tourism_sites"("destination_id", "status");
CREATE INDEX "tourism_sites_organization_id_idx" ON "tourism_sites"("organization_id");
CREATE INDEX "tourism_sites_participation_level_idx" ON "tourism_sites"("participation_level");

CREATE INDEX "checkins_user_id_checked_in_at_idx" ON "checkins"("user_id", "checked_in_at" DESC);
CREATE INDEX "checkins_tourism_site_id_checked_in_at_idx" ON "checkins"("tourism_site_id", "checked_in_at" DESC);
CREATE INDEX "checkins_user_id_tourism_site_id_local_date_idx" ON "checkins"("user_id", "tourism_site_id", "local_date");
-- Partial unique: one confirmed check-in per user/site/day
CREATE UNIQUE INDEX "checkins_user_site_day_confirmed_uidx" ON "checkins"("user_id", "tourism_site_id", "local_date") WHERE "status" = 'confirmed';

CREATE UNIQUE INDEX "checkin_evidences_checkin_id_type_key" ON "checkin_evidences"("checkin_id", "type");

CREATE UNIQUE INDEX "point_transactions_award_checkin_id_key" ON "point_transactions"("award_checkin_id");
CREATE UNIQUE INDEX "point_transactions_checkin_id_evidence_type_key" ON "point_transactions"("checkin_id", "evidence_type");
CREATE INDEX "point_transactions_user_id_created_at_idx" ON "point_transactions"("user_id", "created_at" DESC);

CREATE UNIQUE INDEX "badges_slug_key" ON "badges"("slug");
CREATE INDEX "badges_status_sort_order_idx" ON "badges"("status", "sort_order");

CREATE UNIQUE INDEX "user_badges_user_id_badge_id_key" ON "user_badges"("user_id", "badge_id");
CREATE INDEX "user_badges_user_id_awarded_at_idx" ON "user_badges"("user_id", "awarded_at" DESC);
CREATE INDEX "user_badges_badge_id_idx" ON "user_badges"("badge_id");

CREATE UNIQUE INDEX "merchants_organization_id_key" ON "merchants"("organization_id");
CREATE UNIQUE INDEX "merchants_destination_id_slug_key" ON "merchants"("destination_id", "slug");
CREATE INDEX "merchants_status_idx" ON "merchants"("status");

CREATE INDEX "vouchers_merchant_id_status_idx" ON "vouchers"("merchant_id", "status");
CREATE INDEX "vouchers_status_valid_from_valid_until_idx" ON "vouchers"("status", "valid_from", "valid_until");

CREATE UNIQUE INDEX "voucher_claims_claim_code_key" ON "voucher_claims"("claim_code");
CREATE UNIQUE INDEX "voucher_claims_voucher_id_user_id_key" ON "voucher_claims"("voucher_id", "user_id");
CREATE INDEX "voucher_claims_user_id_claimed_at_idx" ON "voucher_claims"("user_id", "claimed_at" DESC);
CREATE INDEX "voucher_claims_claim_code_idx" ON "voucher_claims"("claim_code");

CREATE UNIQUE INDEX "voucher_redemptions_voucher_claim_id_key" ON "voucher_redemptions"("voucher_claim_id");
CREATE INDEX "voucher_redemptions_merchant_staff_user_id_redeemed_at_idx" ON "voucher_redemptions"("merchant_staff_user_id", "redeemed_at" DESC);

-- ForeignKeys
ALTER TABLE "device_bindings" ADD CONSTRAINT "device_bindings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_consents" ADD CONSTRAINT "user_consents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "otp_challenges" ADD CONSTRAINT "otp_challenges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "tourism_sites" ADD CONSTRAINT "tourism_sites_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "destinations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tourism_sites" ADD CONSTRAINT "tourism_sites_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "checkins" ADD CONSTRAINT "checkins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "checkins" ADD CONSTRAINT "checkins_voided_by_user_id_fkey" FOREIGN KEY ("voided_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "checkins" ADD CONSTRAINT "checkins_tourism_site_id_fkey" FOREIGN KEY ("tourism_site_id") REFERENCES "tourism_sites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "checkins" ADD CONSTRAINT "checkins_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "destinations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "checkin_evidences" ADD CONSTRAINT "checkin_evidences_checkin_id_fkey" FOREIGN KEY ("checkin_id") REFERENCES "checkins"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "checkin_proofs" ADD CONSTRAINT "checkin_proofs_checkin_id_fkey" FOREIGN KEY ("checkin_id") REFERENCES "checkins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "point_transactions" ADD CONSTRAINT "point_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "point_transactions" ADD CONSTRAINT "point_transactions_checkin_id_fkey" FOREIGN KEY ("checkin_id") REFERENCES "checkins"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "point_transactions" ADD CONSTRAINT "point_transactions_voucher_claim_id_fkey" FOREIGN KEY ("voucher_claim_id") REFERENCES "voucher_claims"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "badges" ADD CONSTRAINT "badges_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "destinations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "badges" ADD CONSTRAINT "badges_issuer_organization_id_fkey" FOREIGN KEY ("issuer_organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "badges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_trigger_checkin_id_fkey" FOREIGN KEY ("trigger_checkin_id") REFERENCES "checkins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "merchants" ADD CONSTRAINT "merchants_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "merchants" ADD CONSTRAINT "merchants_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "destinations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "destinations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "voucher_claims" ADD CONSTRAINT "voucher_claims_voucher_id_fkey" FOREIGN KEY ("voucher_id") REFERENCES "vouchers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "voucher_claims" ADD CONSTRAINT "voucher_claims_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "voucher_redemptions" ADD CONSTRAINT "voucher_redemptions_voucher_claim_id_fkey" FOREIGN KEY ("voucher_claim_id") REFERENCES "voucher_claims"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "voucher_redemptions" ADD CONSTRAINT "voucher_redemptions_merchant_staff_user_id_fkey" FOREIGN KEY ("merchant_staff_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
