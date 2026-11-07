import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { UserRole } from '@tp/db';
import { JwtPayload } from '../../auth/jwt-auth.guard';
import { ApiException } from '../api.exception';

const MERCHANT_ROLES: UserRole[] = [UserRole.merchant_owner, UserRole.merchant_staff];

@Injectable()
export class MerchantRoleGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{ user?: JwtPayload }>();
    const user = req.user;
    if (!user) {
      throw new ApiException('AUTH_REQUIRED', 'Cần đăng nhập.', 401);
    }
    if (!MERCHANT_ROLES.includes(user.role as UserRole)) {
      throw new ApiException('FORBIDDEN', 'Chỉ dành cho merchant.', 403);
    }
    if (!user.orgId) {
      throw new ApiException('FORBIDDEN', 'Thiếu thông tin tổ chức.', 403);
    }
    return true;
  }
}
