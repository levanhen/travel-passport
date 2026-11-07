import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard, JwtPayload } from '../auth/jwt-auth.guard';
import { TouristRoleGuard } from '../shared/guards/tourist-role.guard';
import { ListTransactionsQueryDto } from './dto/list-transactions-query.dto';
import { PointsService } from './points.service';

@Controller('points')
@UseGuards(JwtAuthGuard, TouristRoleGuard)
export class PointsController {
  constructor(private readonly points: PointsService) {}

  @Get('summary')
  async summary(@CurrentUser() user: JwtPayload) {
    const data = await this.points.getSummary(user.sub);
    return { data };
  }

  @Get('transactions')
  async transactions(@CurrentUser() user: JwtPayload, @Query() query: ListTransactionsQueryDto) {
    const result = await this.points.listTransactions(
      user.sub,
      query.page ?? 1,
      query.limit ?? 20,
      query.type,
    );
    return result;
  }
}
