import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { ProfileModule } from './profile/profile.module';
import { DestinationsModule } from './destinations/destinations.module';
import { CheckInModule } from './check-in/check-in.module';
import { PointsModule } from './points/points.module';
import { BadgesModule } from './badges/badges.module';
import { VouchersModule } from './vouchers/vouchers.module';
import { MerchantsModule } from './merchants/merchants.module';
import { AdminModule } from './admin/admin.module';
import { MerchantPortalModule } from './merchant/merchant.module';
import { SharedModule } from './shared/shared.module';

@Module({
  imports: [
    SharedModule,
    AuthModule,
    ProfileModule,
    DestinationsModule,
    CheckInModule,
    PointsModule,
    BadgesModule,
    VouchersModule,
    MerchantsModule,
    AdminModule,
    MerchantPortalModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
