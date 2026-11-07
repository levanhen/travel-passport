import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { JwtPayload } from './jwt-auth.guard';

@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request & { user?: JwtPayload }>();
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) return true;
    try {
      req.user = this.jwt.verify<JwtPayload>(header.slice(7), {
        secret: process.env.JWT_ACCESS_SECRET ?? 'change-me-access',
      });
    } catch {
      // ignore invalid token — treat as public
    }
    return true;
  }
}
