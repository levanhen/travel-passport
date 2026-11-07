import { HttpStatus, Injectable } from '@nestjs/common';
import { Merchant, UserRole } from '@tp/db';
import { JwtPayload } from '../auth/jwt-auth.guard';
import { ApiException } from '../shared/api.exception';
import { PrismaService } from '../shared/prisma.service';

@Injectable()
export class MerchantPortalService {
  constructor(private readonly prisma: PrismaService) {}

  async getMerchantForUser(user: JwtPayload): Promise<Merchant> {
    if (!user.orgId) {
      throw new ApiException('FORBIDDEN', 'Thiếu thông tin tổ chức.', 403);
    }
    const merchant = await this.prisma.merchant.findUnique({
      where: { organizationId: user.orgId },
    });
    if (!merchant) {
      throw new ApiException('NOT_FOUND', 'Không tìm thấy merchant.', HttpStatus.NOT_FOUND);
    }
    return merchant;
  }

  assertOwner(user: JwtPayload) {
    if (user.role !== UserRole.merchant_owner) {
      throw new ApiException('FORBIDDEN', 'Chỉ merchant owner mới được thực hiện.', 403);
    }
  }
}
