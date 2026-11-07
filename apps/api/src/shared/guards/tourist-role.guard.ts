import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRole } from '@tp/db';
import { Request } from 'express';
import { JwtPayload } from '../../auth/jwt-auth.guard';

@Injectable()
export class TouristRoleGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request & { user?: JwtPayload }>();
    if (!req.user) {
      throw new UnauthorizedException({
        error: { code: 'AUTH_REQUIRED', message: 'Cần đăng nhập.', details: {} },
      });
    }
    if (req.user.role !== UserRole.tourist) {
      throw new UnauthorizedException({
        error: {
          code: 'FORBIDDEN',
          message: 'Chỉ dành cho tài khoản khách du lịch.',
          details: {},
        },
      });
    }
    return true;
  }
}
