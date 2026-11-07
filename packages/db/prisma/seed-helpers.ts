import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

export async function ensureEmailUser(
  prisma: PrismaClient,
  opts: {
    email: string;
    password: string;
    role: UserRole;
    organizationId?: string;
    membershipRole?: UserRole;
  },
): Promise<void> {
  const email = opts.email.trim().toLowerCase();
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const passwordHash = await bcrypt.hash(opts.password, 10);
    user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: opts.role,
        status: UserStatus.active,
      },
    });
    console.log(`Created ${opts.role}: ${email}`);
  }

  if (opts.organizationId && opts.membershipRole) {
    const existing = await prisma.membership.findFirst({
      where: { userId: user.id, organizationId: opts.organizationId },
    });
    if (!existing) {
      await prisma.membership.create({
        data: {
          userId: user.id,
          organizationId: opts.organizationId,
          role: opts.membershipRole,
        },
      });
    }
  }
}

export function envOr(key: string, fallback: string): string {
  return process.env[key]?.trim() || fallback;
}
