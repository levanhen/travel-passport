import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@tp/db';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard, JwtPayload } from '../auth/jwt-auth.guard';
import { Roles } from '../shared/decorators/roles.decorator';
import { RolesGuard } from '../shared/guards/roles.guard';
import { PaginationQueryDto } from '../shared/dto/pagination-query.dto';
import { AdminCheckInsService } from './admin-check-ins.service';
import { VoidCheckinDto } from './dto/admin-check-in.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.site_operator, UserRole.authority_admin, UserRole.platform_admin)
export class AdminCheckInsController {
  constructor(private readonly checkIns: AdminCheckInsService) {}

  @Get('sites/:siteId/check-ins')
  async listBySite(
    @CurrentUser() user: JwtPayload,
    @Param('siteId') siteId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.checkIns.listBySite(user, siteId, query.page ?? 1, query.limit ?? 20);
  }

  @Get('check-ins/:id')
  async getOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    const data = await this.checkIns.getDetail(user, id);
    return { data };
  }

  @Patch('check-ins/:id')
  @Roles(UserRole.authority_admin, UserRole.platform_admin)
  async voidCheckin(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: VoidCheckinDto,
  ) {
    const data = await this.checkIns.voidCheckin(user, id, dto.voidReason);
    return { data };
  }
}
