import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Request } from 'express';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard, JwtPayload } from '../auth/jwt-auth.guard';
import { TouristRoleGuard } from '../shared/guards/tourist-role.guard';
import { CheckInService } from './check-in.service';
import { PaginationQueryDto } from '../shared/dto/pagination-query.dto';
import {
  AddQrEvidenceDto,
  CreatePartnerCheckinDto,
  CreateSelfCheckinDto,
} from './dto/check-in.dto';

@Controller('check-ins')
@UseGuards(JwtAuthGuard, TouristRoleGuard)
export class CheckInController {
  constructor(private readonly checkIns: CheckInService) {}

  @Post('self')
  async createSelf(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateSelfCheckinDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    const data = await this.checkIns.createSelf(user, dto, idempotencyKey);
    return { data };
  }

  @Post()
  async createPartner(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreatePartnerCheckinDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    const data = await this.checkIns.createPartner(user, dto, idempotencyKey);
    return { data };
  }

  @Get()
  async list(@CurrentUser() user: JwtPayload, @Query() query: PaginationQueryDto) {
    return this.checkIns.list(user, query.page ?? 1, query.limit ?? 20);
  }

  @Get(':id')
  async getOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    const data = await this.checkIns.getOne(user, id);
    return { data };
  }

  @Post(':id/evidence')
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async addEvidence(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: AddQrEvidenceDto & { type?: string; deviceId?: string },
    @UploadedFile() photo: Express.Multer.File | undefined,
    @Req() req: Request,
  ) {
    const contentType = req.headers['content-type'] ?? '';
    if (contentType.includes('multipart/form-data')) {
      const type = (req.body?.type as string) ?? body.type;
      if (type === 'photo') {
        const deviceId = (req.body?.deviceId as string) ?? body.deviceId ?? '';
        const data = await this.checkIns.addPhotoEvidence(user, id, photo!, deviceId);
        return { data };
      }
    }

    if (body.type === 'qr' || (!photo && body.latitude != null)) {
      const data = await this.checkIns.addQrEvidence(user, id, {
        qrToken: body.qrToken,
        latitude: body.latitude,
        longitude: body.longitude,
        deviceId: body.deviceId,
      });
      return { data };
    }

    const data = await this.checkIns.addQrEvidence(user, id, body);
    return { data };
  }
}
