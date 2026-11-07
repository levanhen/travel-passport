import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UserRole, Badge } from '@tp/db';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard, JwtPayload } from '../auth/jwt-auth.guard';
import { Roles } from '../shared/decorators/roles.decorator';
import { RolesGuard } from '../shared/guards/roles.guard';
import { AdminBadgesService } from './admin-badges.service';
import { CreateAdminBadgeDto, PatchAdminBadgeDto } from './dto/admin-badge.dto';

@Controller('admin/badges')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.authority_admin, UserRole.platform_admin)
export class AdminBadgesController {
  constructor(private readonly badges: AdminBadgesService) {}

  @Get()
  async list(@CurrentUser() user: JwtPayload): Promise<{ data: Badge[] }> {
    const data = await this.badges.list(user);
    return { data };
  }

  @Get(':id')
  async getOne(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<{ data: Badge }> {
    const data = await this.badges.getOne(user, id);
    return { data };
  }

  @Post()
  async create(@CurrentUser() user: JwtPayload, @Body() dto: CreateAdminBadgeDto) {
    const data = await this.badges.create(user, dto);
    return { data };
  }

  @Patch(':id')
  async patch(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: PatchAdminBadgeDto,
  ) {
    const data = await this.badges.patch(user, id, dto);
    return { data };
  }
}
