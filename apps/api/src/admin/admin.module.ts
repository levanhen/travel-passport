import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CheckInModule } from '../check-in/check-in.module';
import { DestinationsModule } from '../destinations/destinations.module';
import { PointsModule } from '../points/points.module';
import { RolesGuard } from '../shared/guards/roles.guard';
import { AdminBadgesController } from './admin-badges.controller';
import { AdminBadgesService } from './admin-badges.service';
import { AdminCheckInsController } from './admin-check-ins.controller';
import { AdminCheckInsService } from './admin-check-ins.service';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminMerchantsController } from './admin-merchants.controller';
import { AdminMerchantsService } from './admin-merchants.service';
import { AdminQrController } from './admin-qr.controller';
import { AdminQrService } from './admin-qr.service';
import { AdminSitesController } from './admin-sites.controller';
import { AdminSitesService } from './admin-sites.service';

@Module({
  imports: [AuthModule, DestinationsModule, CheckInModule, PointsModule],
  controllers: [
    AdminSitesController,
    AdminQrController,
    AdminBadgesController,
    AdminMerchantsController,
    AdminCheckInsController,
    AdminDashboardController,
  ],
  providers: [
    AdminSitesService,
    AdminQrService,
    AdminBadgesService,
    AdminMerchantsService,
    AdminCheckInsService,
    AdminDashboardService,
    RolesGuard,
  ],
})
export class AdminModule {}
