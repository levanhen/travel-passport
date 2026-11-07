import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MerchantRoleGuard } from '../shared/guards/merchant-role.guard';
import { MerchantBusinessController } from './merchant-business.controller';
import { MerchantPortalService } from './merchant-portal.service';
import { MerchantRedemptionsController } from './merchant-redemptions.controller';
import { MerchantStaffController } from './merchant-staff.controller';
import { MerchantVouchersController } from './merchant-vouchers.controller';

@Module({
  imports: [AuthModule],
  controllers: [
    MerchantBusinessController,
    MerchantVouchersController,
    MerchantRedemptionsController,
    MerchantStaffController,
  ],
  providers: [MerchantPortalService, MerchantRoleGuard],
  exports: [MerchantPortalService],
})
export class MerchantPortalModule {}
