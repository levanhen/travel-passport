import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TouristRoleGuard } from '../shared/guards/tourist-role.guard';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { OptionalJwtAuthGuard } from './optional-jwt-auth.guard';
import { TouristAuthController } from './tourist-auth.controller';

@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController, TouristAuthController],
  providers: [AuthService, JwtAuthGuard, OptionalJwtAuthGuard, TouristRoleGuard],
  exports: [AuthService, JwtAuthGuard, OptionalJwtAuthGuard, JwtModule],
})
export class AuthModule {}
