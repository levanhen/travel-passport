# @tp/db: Prisma package

This package holds the shared Prisma schema, migrations, and seed data for Travel Passport. The schema lives in [`prisma/schema.prisma`](prisma/schema.prisma) (MVP 1).

## MVP 1 models

| Domain | Models |
|---|---|
| Identity | `User`, `TouristProfile`, `DeviceBinding`, `RefreshToken`, `Membership`, `UserConsent`, `OtpChallenge` |
| Destinations | `Organization`, `Destination`, `TourismSite` |
| Check-in | `Checkin`, `CheckinEvidence`, `CheckinProof` |
| Points | `PointTransaction` |
| Badges | `Badge`, `UserBadge` |
| Merchants | `Merchant` |
| Vouchers | `Voucher`, `VoucherClaim`, `VoucherRedemption` |

## Notes

- **One confirmed check-in per site per day** is enforced by a partial unique index in raw SQL (`WHERE status = 'confirmed'`), not by a regular Prisma `@@unique`.
- `PointTransaction.awardCheckinId` is unique for `CHECKIN_AWARD`, so each check-in gets exactly one award.
- `@@unique([checkinId, evidenceType])` stops the QR or photo bonus from being awarded twice.
- There is no `RewardRule` table yet. Point amounts are fixed in code (post-MVP work).

## Commands

`packages/db/.env` must define `DATABASE_URL`. Run these from the repository root:

```bash
pnpm db:generate   # generate the Prisma client
pnpm db:migrate    # prisma migrate dev
pnpm db:seed       # seed the Đà Nẵng pilot (prisma/seed.ts)
```

## Seed data

The seed creates the `da-nang` destination with:

- About 30 catalog sites. They use GPS check-in, and some also have a static QR.
- Partner sites with operator accounts and rotating kiosk QR codes.
- Merchants with owner and staff accounts, plus sample vouchers.

The [main README](../../README.md#demo-accounts) lists the demo accounts.
