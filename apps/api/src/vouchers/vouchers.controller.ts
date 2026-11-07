import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { VoucherClaimStatus } from '@tp/db';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard, JwtPayload } from '../auth/jwt-auth.guard';
import { TouristRoleGuard } from '../shared/guards/tourist-role.guard';
import { PaginationQueryDto } from '../shared/dto/pagination-query.dto';
import { VouchersService } from './vouchers.service';

@Controller('vouchers')
@UseGuards(JwtAuthGuard, TouristRoleGuard)
export class VouchersController {
  constructor(private readonly vouchers: VouchersService) {}

  @Get('available')
  async available(
    @CurrentUser() user: JwtPayload,
    @Query('destinationId') destinationId?: string,
  ) {
    const data = await this.vouchers.listAvailable(user.sub, destinationId);
    return { data };
  }

  @Get('claims')
  async claims(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: VoucherClaimStatus,
    @Query() query?: PaginationQueryDto,
  ) {
    return this.vouchers.listClaims(
      user.sub,
      status,
      query?.page ?? 1,
      query?.limit ?? 20,
    );
  }

  @Post(':id/claim')
  async claim(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    const data = await this.vouchers.claim(user, id);
    return { data };
  }
}
