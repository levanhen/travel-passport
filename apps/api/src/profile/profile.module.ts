import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TouristRoleGuard } from '../shared/guards/tourist-role.guard';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';

@Module({
  imports: [AuthModule],
  controllers: [ProfileController],
  providers: [ProfileService, TouristRoleGuard],
  exports: [ProfileService],
})
export class ProfileModule {}
