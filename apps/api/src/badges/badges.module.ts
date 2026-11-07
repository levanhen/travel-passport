import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BadgesController } from './badges.controller';
import { BadgesService } from './badges.service';
import { TouristRoleGuard } from '../shared/guards/tourist-role.guard';

@Module({
  imports: [AuthModule],
  controllers: [BadgesController],
  providers: [BadgesService, TouristRoleGuard],
  exports: [BadgesService],
})
export class BadgesModule {}
