import { Controller, Get, UseGuards } from '@nestjs/common';
import { UserRole } from '@tp/db';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard, JwtPayload } from '../auth/jwt-auth.guard';
import { Roles } from '../shared/decorators/roles.decorator';
import { RolesGuard } from '../shared/guards/roles.guard';
import { AdminDashboardService } from './admin-dashboard.service';

@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.site_operator, UserRole.authority_admin, UserRole.platform_admin)
export class AdminDashboardController {
  constructor(private readonly dashboard: AdminDashboardService) {}

  @Get()
  async get(@CurrentUser() user: JwtPayload) {
    const data = await this.dashboard.getDashboard(user);
    return { data };
  }
}
