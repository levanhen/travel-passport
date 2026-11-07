import { HttpStatus, Injectable } from '@nestjs/common';
import { TouristLevel, UserRole } from '@tp/db';
import { ApiException } from '../shared/api.exception';
import { PrismaService } from '../shared/prisma.service';
import { levelLabel } from '../points/level.util';
import { PatchProfileDto } from './dto/patch-profile.dto';

function maskPhone(phone: string | null): string | null {
  if (!phone) return null;
  if (phone.length <= 4) return '****';
  return `${'*'.repeat(Math.min(phone.length - 4, 6))}${phone.slice(-4)}`;
}

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  private toProfile(user: {
    phone: string | null;
    phoneVerifiedAt: Date | null;
    touristProfile: {
      displayName: string;
      bio: string | null;
      avatarObjectKey: string | null;
      level: string;
      pointsBalance: number;
    } | null;
  }) {
    if (!user.touristProfile) {
      throw new ApiException('NOT_FOUND', 'Không tìm thấy hồ sơ.', HttpStatus.NOT_FOUND);
    }
    const p = user.touristProfile;
    return {
      displayName: p.displayName,
      bio: p.bio,
      avatarUrl: p.avatarObjectKey,
      phoneMasked: maskPhone(user.phone),
      phoneVerified: !!user.phoneVerifiedAt,
      level: p.level,
      levelLabel: levelLabel(p.level as TouristLevel),
      pointsBalance: p.pointsBalance,
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { touristProfile: true },
    });
    if (!user || user.role !== UserRole.tourist || !user.touristProfile) {
      throw new ApiException('NOT_FOUND', 'Không tìm thấy hồ sơ.', HttpStatus.NOT_FOUND);
    }
    return this.toProfile(user);
  }

  async updateProfile(userId: string, dto: PatchProfileDto) {
    if (dto.displayName === undefined && dto.bio === undefined) {
      throw new ApiException('VALIDATION_ERROR', 'Cần ít nhất một trường để cập nhật.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { touristProfile: true },
    });
    if (!user || user.role !== UserRole.tourist || !user.touristProfile) {
      throw new ApiException('NOT_FOUND', 'Không tìm thấy hồ sơ.', HttpStatus.NOT_FOUND);
    }

    const data: { displayName?: string; bio?: string | null } = {};
    if (dto.displayName !== undefined) data.displayName = dto.displayName.trim();
    if (dto.bio !== undefined) data.bio = dto.bio.trim() || null;

    await this.prisma.touristProfile.update({
      where: { userId },
      data,
    });

    return this.getProfile(userId);
  }
}
