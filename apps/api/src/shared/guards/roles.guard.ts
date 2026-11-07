import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@tp/db';
import { ApiException } from '../api.exception';
import { JwtPayload } from '../../auth/jwt-auth.guard';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles?.length) return true;

    const req = context.switchToHttp().getRequest<{ user?: JwtPayload }>();
    const user = req.user;
    if (!user) {
      throw new ApiException('AUTH_REQUIRED', 'Cần đăng nhập.', 401);
    }
    if (!roles.includes(user.role as UserRole)) {
      throw new ApiException('FORBIDDEN', 'Bạn không có quyền thực hiện thao tác này.', 403);
    }
    return true;
  }
}
