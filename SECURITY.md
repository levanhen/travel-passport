# Security Policy

## Supported versions

Travel Passport is pre-1.0. Security fixes go to the latest `master` branch only.

## Reporting a vulnerability

**Do not open a public issue for security vulnerabilities.**

Report them privately through GitHub's [private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability). Use the **Security** tab of this repository, then choose **Report a vulnerability**.

Please include:

- A description of the issue and its impact
- Steps to reproduce, or a proof of concept
- Affected components (`apps/api`, `apps/web`, `packages/db`) and versions or commits

We aim to acknowledge reports within 5 business days and will keep you updated until the issue is resolved. We are happy to credit reporters in the release notes unless you prefer to stay anonymous.

## Scope notes

Areas of particular interest:

- Authentication: tourist PIN and device binding, staff login, JWT and refresh-token rotation
- Check-in fraud: geofence bypass, QR replay, photo evidence
- Voucher claim and redemption: double redemption, cross-merchant access
- Role and organization isolation (`orgId` scoping in the back office and merchant portal)

## Deployment hardening

Before you deploy this project:

- Set strong, unique `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` values.
- Override every seeded demo password, or do not run the seed in production.
- Make sure `CHECKIN_SKIP_GEOFENCE` and `NEXT_PUBLIC_DEMO_SKIP_GEOFENCE` are **not** enabled.
- Restrict `CORS_ORIGIN` to your real web origin and serve everything over HTTPS.
