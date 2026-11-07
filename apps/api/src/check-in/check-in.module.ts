import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BadgesModule } from '../badges/badges.module';
import { PointsModule } from '../points/points.module';
import { TouristRoleGuard } from '../shared/guards/tourist-role.guard';
import { CheckInController } from './check-in.controller';
import { CheckInQrService } from './check-in-qr.service';
import { CheckInService } from './check-in.service';

@Module({
  imports: [AuthModule, PointsModule, BadgesModule],
  controllers: [CheckInController],
  providers: [CheckInService, CheckInQrService, TouristRoleGuard],
  exports: [CheckInService, CheckInQrService],
})
export class CheckInModule {}
