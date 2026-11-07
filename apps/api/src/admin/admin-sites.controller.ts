import { Body, Controller, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@tp/db';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard, JwtPayload } from '../auth/jwt-auth.guard';
import { Roles } from '../shared/decorators/roles.decorator';
import { RolesGuard } from '../shared/guards/roles.guard';
import { AdminSitesService } from './admin-sites.service';
import { CreateAdminSiteDto, PatchAdminSiteDto } from './dto/admin-site.dto';

@Controller('admin/sites')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.site_operator, UserRole.authority_admin, UserRole.platform_admin)
export class AdminSitesController {
  constructor(private readonly sites: AdminSitesService) {}

  @Post()
  async create(@CurrentUser() user: JwtPayload, @Body() dto: CreateAdminSiteDto) {
    const data = await this.sites.create(user, dto);
    return { data };
  }

  @Patch(':id')
  async patch(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: PatchAdminSiteDto,
  ) {
    const data = await this.sites.patch(user, id, dto);
    return { data };
  }
}
