import { HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User, UserRole, UserStatus } from '@tp/db';
import { Response } from 'express';
import { ApiException } from '../shared/api.exception';
import { PrismaService } from '../shared/prisma.service';
import {
  dummyPasswordVerify,
  dummyPinVerify,
  hashDeviceId,
  hashRefreshToken,
  hashSecret,
  isWeakPin,
  newRefreshToken,
  normalizeEmail,
  normalizePhone,
  verifySecret,
} from './auth.util';
import { ConsentDto } from './dto/tourist-auth.dto';

const MAX_DEVICES = 5;
const PIN_MAX_FAILS = 5;
const PIN_LOCK_MINUTES = 15;
const REFRESH_DAYS = 30;
const ACCESS_TTL = '15m';

const STAFF_ROLES: UserRole[] = [
  UserRole.site_operator,
  UserRole.authority_admin,
  UserRole.platform_admin,
  UserRole.merchant_owner,
  UserRole.merchant_staff,
];

type SessionUser = {
  id: string;
  phone: string | null;
  email: string | null;
  role: UserRole;
  orgId: string | null;
  phoneVerified: boolean;
  profile: { displayName: string; avatarUrl: string | null } | null;
};

type AuthUser = User & {
  touristProfile: { displayName: string; avatarObjectKey: string | null } | null;
  memberships?: { organizationId: string }[];
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  private policyVersion(): string {
    return process.env.LEGAL_POLICY_VERSION ?? '2026-09-01';
  }

  private requirePhone(phoneRaw: string): string {
    const phone = normalizePhone(phoneRaw);
    if (!phone) {
      throw new ApiException('VALIDATION_ERROR', 'Số điện thoại không hợp lệ (MVP: +84).');
    }
    return phone;
  }

  private requireDeviceId(deviceId: string): string {
    if (!deviceId || deviceId.length < 8) {
      throw new ApiException('VALIDATION_ERROR', 'deviceId không hợp lệ.');
    }
    return deviceId;
  }

  private toSessionUser(user: AuthUser, orgId: string | null): SessionUser {
    return {
      id: user.id,
      phone: user.phone,
      email: user.email,
      role: user.role,
      orgId,
      phoneVerified: !!user.phoneVerifiedAt,
      profile: user.touristProfile
        ? {
            displayName: user.touristProfile.displayName,
            avatarUrl: user.touristProfile.avatarObjectKey,
          }
        : null,
    };
  }

  private resolveOrgId(user: AuthUser): string | null {
    if (
      user.role === UserRole.tourist ||
      user.role === UserRole.platform_admin ||
      user.role === UserRole.authority_admin
    ) {
      return null;
    }
    return user.memberships?.[0]?.organizationId ?? null;
  }

  private signAccess(user: User, orgId: string | null): string {
    return this.jwt.sign(
      { sub: user.id, role: user.role, orgId },
      {
        secret: process.env.JWT_ACCESS_SECRET ?? 'change-me-access',
        expiresIn: ACCESS_TTL,
      },
    );
  }

  private setRefreshCookie(res: Response, raw: string) {
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('refresh_token', raw, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/api/v1/auth',
      maxAge: REFRESH_DAYS * 24 * 60 * 60 * 1000,
    });
  }

  private clearRefreshCookie(res: Response) {
    res.clearCookie('refresh_token', { path: '/api/v1/auth' });
  }

  private async issueSession(
    res: Response,
    user: AuthUser,
    deviceId: string | null,
  ) {
    const orgId = this.resolveOrgId(user);
    const { raw, hash } = newRefreshToken();
    const expiresAt = new Date(Date.now() + REFRESH_DAYS * 24 * 60 * 60 * 1000);
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hash,
        deviceIdHash: deviceId ? hashDeviceId(deviceId) : null,
        expiresAt,
      },
    });
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    this.setRefreshCookie(res, raw);
    return {
      data: {
        accessToken: this.signAccess(user, orgId),
        user: this.toSessionUser(user, orgId),
      },
    };
  }

  private async bindDevice(userId: string, deviceId: string) {
    const deviceIdHash = hashDeviceId(deviceId);
    const existing = await this.prisma.deviceBinding.findUnique({
      where: { userId_deviceIdHash: { userId, deviceIdHash } },
    });
    if (existing) {
      await this.prisma.deviceBinding.update({
        where: { id: existing.id },
        data: { lastSeenAt: new Date() },
      });
      return;
    }
    const count = await this.prisma.deviceBinding.count({ where: { userId } });
    if (count >= MAX_DEVICES) {
      const oldest = await this.prisma.deviceBinding.findFirst({
        where: { userId },
        orderBy: { lastSeenAt: 'asc' },
      });
      if (oldest) {
        await this.prisma.deviceBinding.delete({ where: { id: oldest.id } });
      }
    }
    await this.prisma.deviceBinding.create({
      data: { userId, deviceIdHash, label: null },
    });
  }

  private assertNotLocked(user: User) {
    if (user.pinLockedUntil && user.pinLockedUntil > new Date()) {
      throw new ApiException(
        'AUTH_PIN_LOCKED',
        'Bạn đã nhập sai quá nhiều lần. Thử lại sau.',
        423,
      );
    }
  }

  private async registerPinFail(userId: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { pinFailedAttempts: { increment: 1 } },
    });
    if (user.pinFailedAttempts >= PIN_MAX_FAILS) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          pinLockedUntil: new Date(Date.now() + PIN_LOCK_MINUTES * 60 * 1000),
          pinFailedAttempts: 0,
        },
      });
      throw new ApiException(
        'AUTH_PIN_LOCKED',
        'Bạn đã nhập sai quá nhiều lần. Thử lại sau.',
        423,
      );
    }
  }

  private async clearPinFail(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { pinFailedAttempts: 0, pinLockedUntil: null },
    });
  }

  async touristStart(res: Response, phoneRaw: string, deviceIdRaw: string) {
    const phone = this.requirePhone(phoneRaw);
    const deviceId = this.requireDeviceId(deviceIdRaw);
    const deviceIdHash = hashDeviceId(deviceId);

    const user = await this.prisma.user.findUnique({
      where: { phone },
      include: { touristProfile: true },
    });

    if (!user) {
      return { status: 202 as const, body: { data: { next: 'set_pin' as const } } };
    }

    if (user.status === UserStatus.disabled) {
      throw new ApiException(
        'AUTH_ACCOUNT_DISABLED',
        'Tài khoản đã bị khóa. Liên hệ hỗ trợ.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (user.role !== UserRole.tourist) {
      throw new ApiException('VALIDATION_ERROR', 'Số điện thoại không hợp lệ.');
    }

    this.assertNotLocked(user);

    const binding = await this.prisma.deviceBinding.findUnique({
      where: { userId_deviceIdHash: { userId: user.id, deviceIdHash } },
    });

    if (binding) {
      await this.prisma.deviceBinding.update({
        where: { id: binding.id },
        data: { lastSeenAt: new Date() },
      });
      const body = await this.issueSession(res, user, deviceId);
      return { status: 200 as const, body };
    }

    throw new ApiException(
      'AUTH_PIN_REQUIRED',
      'Nhập PIN để dùng máy này.',
      HttpStatus.UNAUTHORIZED,
    );
  }

  async touristSetPin(
    res: Response,
    phoneRaw: string,
    deviceIdRaw: string,
    pin: string,
    consent?: ConsentDto,
  ) {
    const phone = this.requirePhone(phoneRaw);
    const deviceId = this.requireDeviceId(deviceIdRaw);

    if (isWeakPin(pin)) {
      throw new ApiException('AUTH_PIN_WEAK', 'Mã PIN quá dễ đoán. Vui lòng chọn mã khác.');
    }

    if (!consent?.termsVersion || !consent?.privacyVersion || !consent?.acceptedAt) {
      throw new ApiException(
        'CONSENT_REQUIRED',
        'Bạn cần đồng ý Điều khoản và Chính sách quyền riêng tư.',
      );
    }

    const expected = this.policyVersion();
    if (consent.termsVersion !== expected || consent.privacyVersion !== expected) {
      throw new ApiException(
        'CONSENT_REQUIRED',
        'Phiên bản điều khoản không khớp. Tải lại trang và đồng ý lại.',
      );
    }

    const existing = await this.prisma.user.findUnique({ where: { phone } });
    if (existing) {
      throw new ApiException(
        'AUTH_PHONE_TAKEN',
        'Số điện thoại đã đăng ký. Vui lòng đăng nhập.',
        HttpStatus.CONFLICT,
      );
    }

    const passwordHash = await hashSecret(pin);
    const last4 = phone.slice(-4);
    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          phone,
          passwordHash,
          role: UserRole.tourist,
          touristProfile: {
            create: {
              displayName: `Khách ${last4}`,
            },
          },
          consents: {
            create: {
              termsVersion: consent.termsVersion,
              privacyVersion: consent.privacyVersion,
              acceptedAt: new Date(consent.acceptedAt),
            },
          },
        },
        include: { touristProfile: true },
      });
      await tx.deviceBinding.create({
        data: {
          userId: created.id,
          deviceIdHash: hashDeviceId(deviceId),
        },
      });
      return created;
    });

    const body = await this.issueSession(res, user, deviceId);
    return { status: 201 as const, body };
  }

  async touristUnlock(res: Response, phoneRaw: string, deviceIdRaw: string, pin: string) {
    const phone = this.requirePhone(phoneRaw);
    const deviceId = this.requireDeviceId(deviceIdRaw);

    if (!/^\d{6}$/.test(pin)) {
      throw new ApiException('VALIDATION_ERROR', 'PIN phải gồm 6 chữ số.');
    }

    const user = await this.prisma.user.findUnique({
      where: { phone },
      include: { touristProfile: true },
    });

    if (!user || user.role !== UserRole.tourist) {
      await dummyPinVerify(pin);
      throw new ApiException('AUTH_INVALID_PIN', 'Mã PIN không đúng.', HttpStatus.UNAUTHORIZED);
    }

    if (user.status === UserStatus.disabled) {
      throw new ApiException(
        'AUTH_ACCOUNT_DISABLED',
        'Tài khoản đã bị khóa. Liên hệ hỗ trợ.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    this.assertNotLocked(user);

    const ok = await verifySecret(pin, user.passwordHash);
    if (!ok) {
      await this.registerPinFail(user.id);
      throw new ApiException('AUTH_INVALID_PIN', 'Mã PIN không đúng.', HttpStatus.UNAUTHORIZED);
    }

    await this.clearPinFail(user.id);
    await this.bindDevice(user.id, deviceId);
    const body = await this.issueSession(res, user, deviceId);
    return { status: 200 as const, body };
  }

  async refresh(res: Response, rawCookie?: string) {
    if (!rawCookie) {
      throw new ApiException('AUTH_REQUIRED', 'Cần đăng nhập.', HttpStatus.UNAUTHORIZED);
    }
    const tokenHash = hashRefreshToken(rawCookie);
    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      this.clearRefreshCookie(res);
      throw new ApiException(
        'AUTH_TOKEN_INVALID',
        'Phiên đăng nhập hết hạn.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: stored.userId },
      include: { touristProfile: true, memberships: { select: { organizationId: true } } },
    });
    if (!user || user.status === UserStatus.disabled) {
      this.clearRefreshCookie(res);
      throw new ApiException(
        'AUTH_ACCOUNT_DISABLED',
        'Tài khoản đã bị khóa. Liên hệ hỗ trợ.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    return this.issueSession(res, user, null);
  }

  async logout(res: Response, rawCookie?: string) {
    if (rawCookie) {
      const tokenHash = hashRefreshToken(rawCookie);
      await this.prisma.refreshToken.updateMany({
        where: { tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    this.clearRefreshCookie(res);
    return { data: { ok: true } };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { touristProfile: true, memberships: { select: { organizationId: true } } },
    });
    if (!user || user.status === UserStatus.disabled) {
      throw new ApiException(
        'AUTH_ACCOUNT_DISABLED',
        'Tài khoản đã bị khóa. Liên hệ hỗ trợ.',
        HttpStatus.UNAUTHORIZED,
      );
    }
    const orgId = this.resolveOrgId(user);
    return { data: { user: this.toSessionUser(user, orgId) } };
  }

  async staffLogin(res: Response, emailRaw: string, password: string) {
    const email = normalizeEmail(emailRaw);
    if (!email) {
      throw new ApiException('VALIDATION_ERROR', 'Email không hợp lệ.');
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { touristProfile: true, memberships: { select: { organizationId: true } } },
    });

    const isStaff = user && STAFF_ROLES.includes(user.role);
    if (!isStaff) {
      await dummyPasswordVerify(password);
      throw new ApiException(
        'AUTH_INVALID_CREDENTIALS',
        'Email hoặc mật khẩu không đúng.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (user.status === UserStatus.disabled) {
      throw new ApiException(
        'AUTH_ACCOUNT_DISABLED',
        'Tài khoản đã bị khóa. Liên hệ hỗ trợ.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    this.assertNotLocked(user);

    const ok = await verifySecret(password, user.passwordHash);
    if (!ok) {
      await this.registerPinFail(user.id);
      throw new ApiException(
        'AUTH_INVALID_CREDENTIALS',
        'Email hoặc mật khẩu không đúng.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    await this.clearPinFail(user.id);
    return this.issueSession(res, user, null);
  }

  async touristChangePin(userId: string, oldPin: string, newPin: string) {
    if (!/^\d{6}$/.test(oldPin) || !/^\d{6}$/.test(newPin)) {
      throw new ApiException('VALIDATION_ERROR', 'PIN phải gồm 6 chữ số.');
    }

    if (isWeakPin(newPin)) {
      throw new ApiException('AUTH_PIN_WEAK', 'Mã PIN quá dễ đoán. Vui lòng chọn mã khác.');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== UserRole.tourist) {
      throw new ApiException('NOT_FOUND', 'Không tìm thấy tài khoản.', HttpStatus.NOT_FOUND);
    }

    if (user.status === UserStatus.disabled) {
      throw new ApiException(
        'AUTH_ACCOUNT_DISABLED',
        'Tài khoản đã bị khóa. Liên hệ hỗ trợ.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    this.assertNotLocked(user);

    const ok = await verifySecret(oldPin, user.passwordHash);
    if (!ok) {
      await this.registerPinFail(user.id);
      throw new ApiException('AUTH_INVALID_PIN', 'Mã PIN không đúng.', HttpStatus.UNAUTHORIZED);
    }

    if (oldPin === newPin) {
      throw new ApiException('VALIDATION_ERROR', 'PIN mới phải khác PIN hiện tại.');
    }

    const passwordHash = await hashSecret(newPin);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash, pinFailedAttempts: 0, pinLockedUntil: null },
    });
  }
}
