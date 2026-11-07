import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PointsController } from './points.controller';
import { PointsService } from './points.service';
import { TouristRoleGuard } from '../shared/guards/tourist-role.guard';

@Module({
  imports: [AuthModule],
  controllers: [PointsController],
  providers: [PointsService, TouristRoleGuard],
  exports: [PointsService],
})
export class PointsModule {}
