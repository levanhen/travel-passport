# Contributing to Travel Passport

Thanks for your interest in contributing. This guide covers how to set up the project, how we work, and what we look for in a pull request.

## Ways to contribute

- **Report a bug.** Open an issue using the *Bug report* template.
- **Suggest a feature.** Open an issue using the *Feature request* template. Describe the problem before the solution.
- **Improve docs.** Typos, missing setup steps, and clearer explanations are always welcome.
- **Send code.** Look for issues labeled `good first issue` or `help wanted`. Comment on an issue before starting larger work so we can agree on the approach.

## Development setup

Follow [Getting started](README.md#getting-started) in the README. In short:

```bash
docker compose up -d
pnpm install
pnpm db:generate && pnpm db:migrate && pnpm db:seed
pnpm dev
```

## Project structure

| Path | What lives there |
|---|---|
| `apps/api` | NestJS API. One folder per domain module under `src/`. |
| `apps/web` | Next.js app. `app/(tourist)`, `app/admin`, `app/merchant` are the three surfaces. |
| `packages/db` | Prisma schema, migrations, and seed data |

## Workflow

1. Fork the repository and create a branch from `master`:
   `git checkout -b feat/short-description` (or `fix/…`, `docs/…`, `chore/…`).
2. Make your change. Keep each pull request focused on one concern.
3. Make sure it builds: `pnpm build` and `pnpm lint`.
4. If you change `schema.prisma`, create a migration:
   `pnpm --filter @tp/db exec prisma migrate dev --name <change-name>`
   and commit the generated folder under `packages/db/prisma/migrations/`.
5. Open a pull request and fill in the template.

## Commit messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

```text
feat(check-in): add photo evidence upload
fix(vouchers): prevent double redemption on retry
docs: clarify local setup
```

Common types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`.

## Code style

- TypeScript everywhere. Avoid `any`.
- API: validate every request body or query with a `class-validator` DTO. Throw errors in the shared `{ error: { code, message, details } }` shape (see `apps/api/src/shared/api.exception.ts`).
- Web: put data fetching in each surface's `_lib/`, and shared UI in `_components/`.
- Never commit secrets or `.env` files. Add new variables to `.env.example` and document them in the README.

## User-facing text

The UI is currently in Vietnamese. If you add or change UI strings, keep them consistent with the existing copy. Pull requests that introduce i18n support are welcome; please open an issue first to discuss the approach.

## Code of Conduct

Everyone taking part in this project must follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## License

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
