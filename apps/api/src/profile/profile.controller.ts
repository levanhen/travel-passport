import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard, JwtPayload } from '../auth/jwt-auth.guard';
import { TouristRoleGuard } from '../shared/guards/tourist-role.guard';
import { PatchProfileDto } from './dto/patch-profile.dto';
import { ProfileService } from './profile.service';

@Controller('profile')
@UseGuards(JwtAuthGuard, TouristRoleGuard)
export class ProfileController {
  constructor(private readonly profile: ProfileService) {}

  @Get()
  async get(@CurrentUser() user: JwtPayload) {
    const data = await this.profile.getProfile(user.sub);
    return { data };
  }

  @Patch()
  async patch(@CurrentUser() user: JwtPayload, @Body() dto: PatchProfileDto) {
    const data = await this.profile.updateProfile(user.sub, dto);
    return { data };
  }
}
