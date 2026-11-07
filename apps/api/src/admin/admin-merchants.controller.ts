import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { MerchantStatus, UserRole } from '@tp/db';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard, JwtPayload } from '../auth/jwt-auth.guard';
import { Roles } from '../shared/decorators/roles.decorator';
import { RolesGuard } from '../shared/guards/roles.guard';
import { AdminMerchantsService } from './admin-merchants.service';
import { CreateAdminMerchantDto, PatchAdminMerchantDto } from './dto/admin-merchant.dto';

@Controller('admin/merchants')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.authority_admin, UserRole.platform_admin)
export class AdminMerchantsController {
  constructor(private readonly merchants: AdminMerchantsService) {}

  @Post()
  async create(@CurrentUser() user: JwtPayload, @Body() dto: CreateAdminMerchantDto) {
    const data = await this.merchants.create(user, dto);
    return { data };
  }

  @Get()
  async list(
    @CurrentUser() user: JwtPayload,
    @Query('destinationId') destinationId?: string,
    @Query('status') status?: MerchantStatus,
  ) {
    const data = await this.merchants.list(user, destinationId, status);
    return { data };
  }

  @Patch(':id')
  async patch(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: PatchAdminMerchantDto,
  ) {
    const data = await this.merchants.patch(user, id, dto);
    return { data };
  }
}
