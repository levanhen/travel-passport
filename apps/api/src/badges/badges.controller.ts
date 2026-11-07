import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard, JwtPayload } from '../auth/jwt-auth.guard';
import { TouristRoleGuard } from '../shared/guards/tourist-role.guard';
import { BadgesService } from './badges.service';

@Controller('badges')
@UseGuards(JwtAuthGuard, TouristRoleGuard)
export class BadgesController {
  constructor(private readonly badges: BadgesService) {}

  @Get()
  async list(@CurrentUser() user: JwtPayload, @Query('destinationId') destinationId?: string) {
    const data = await this.badges.listForTourist(user.sub, destinationId);
    return { data };
  }

  @Get('mine')
  async mine(
    @CurrentUser() user: JwtPayload,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.badges.listMine(user.sub, Number(page) || 1, Math.min(Number(limit) || 20, 50));
  }

  @Get(':id')
  async getOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    const data = await this.badges.getForTourist(user.sub, id);
    return { data };
  }
}
