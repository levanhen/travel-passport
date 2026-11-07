import { Module } from '@nestjs/common';

/** Re-export alias — merchant portal lives in merchant/ */
export { MerchantPortalModule as MerchantsModule } from '../merchant/merchant.module';
