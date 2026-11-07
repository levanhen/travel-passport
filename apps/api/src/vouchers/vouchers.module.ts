import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PointsModule } from '../points/points.module';
import { TouristRoleGuard } from '../shared/guards/tourist-role.guard';
import { VouchersController } from './vouchers.controller';
import { VouchersService } from './vouchers.service';

@Module({
  imports: [AuthModule, PointsModule],
  controllers: [VouchersController],
  providers: [VouchersService, TouristRoleGuard],
  exports: [VouchersService],
})
export class VouchersModule {}
