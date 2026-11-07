import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { UserRole } from '@tp/db';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard, JwtPayload } from '../auth/jwt-auth.guard';
import { Roles } from '../shared/decorators/roles.decorator';
import { RolesGuard } from '../shared/guards/roles.guard';
import { AdminQrService } from './admin-qr.service';

@Controller('admin/sites')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.site_operator, UserRole.authority_admin, UserRole.platform_admin)
export class AdminQrController {
  constructor(private readonly qr: AdminQrService) {}

  @Get(':id/qr-token')
  async getToken(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    const data = await this.qr.issueToken(user, id);
    return { data };
  }
}
