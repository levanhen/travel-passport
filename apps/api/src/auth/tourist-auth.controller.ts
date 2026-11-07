import { Body, Controller, HttpCode, HttpStatus, Post, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { TouristRoleGuard } from '../shared/guards/tourist-role.guard';
import { ApiException } from '../shared/api.exception';
import { AuthService } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import { JwtAuthGuard, JwtPayload } from './jwt-auth.guard';
import {
  TouristChangePinDto,
  TouristSetPinDto,
  TouristStartDto,
  TouristUnlockDto,
} from './dto/tourist-auth.dto';

@Controller('auth/tourist')
export class TouristAuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('start')
  async start(@Body() dto: TouristStartDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.touristStart(res, dto.phone, dto.deviceId);
    res.status(result.status);
    return result.body;
  }

  @Post('set-pin')
  async setPin(@Body() dto: TouristSetPinDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.touristSetPin(
      res,
      dto.phone,
      dto.deviceId,
      dto.pin,
      dto.consent,
    );
    res.status(result.status);
    return result.body;
  }

  @Post('unlock')
  @HttpCode(200)
  async unlock(@Body() dto: TouristUnlockDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.touristUnlock(res, dto.phone, dto.deviceId, dto.pin);
    return result.body;
  }

  @Post('forgot-pin')
  forgotPin() {
    throw new ApiException(
      'AUTH_CHANNEL_DISABLED',
      'Quên PIN chưa hỗ trợ trong MVP. Liên hệ hỗ trợ.',
      HttpStatus.NOT_IMPLEMENTED,
    );
  }

  @Post('change-pin')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard, TouristRoleGuard)
  async changePin(@CurrentUser() user: JwtPayload, @Body() dto: TouristChangePinDto) {
    await this.auth.touristChangePin(user.sub, dto.oldPin, dto.newPin);
  }
}
