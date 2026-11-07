import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

export type JwtPayload = {
  sub: string;
  role: string;
  orgId: string | null;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request & { user?: JwtPayload }>();
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException({
        error: { code: 'AUTH_REQUIRED', message: 'Cần đăng nhập.', details: {} },
      });
    }
    try {
      const payload = this.jwt.verify<JwtPayload>(header.slice(7), {
        secret: process.env.JWT_ACCESS_SECRET ?? 'change-me-access',
      });
      req.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException({
        error: { code: 'AUTH_TOKEN_INVALID', message: 'Phiên đăng nhập hết hạn.', details: {} },
      });
    }
  }
}
