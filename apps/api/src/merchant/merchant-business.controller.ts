import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard, JwtPayload } from '../auth/jwt-auth.guard';
import { MerchantRoleGuard } from '../shared/guards/merchant-role.guard';
import { PrismaService } from '../shared/prisma.service';
import { PatchMerchantBusinessDto } from './dto/merchant.dto';
import { MerchantPortalService } from './merchant-portal.service';

@Controller('merchant/business')
@UseGuards(JwtAuthGuard, MerchantRoleGuard)
export class MerchantBusinessController {
  constructor(
    private readonly portal: MerchantPortalService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async get(@CurrentUser() user: JwtPayload) {
    const merchant = await this.portal.getMerchantForUser(user);
    const dest = await this.prisma.destination.findUnique({
      where: { id: merchant.destinationId },
    });
    return {
      data: {
        id: merchant.id,
        name: merchant.name,
        category: merchant.category,
        destinationId: merchant.destinationId,
        destinationName: dest?.name ?? null,
        address: merchant.address,
        contactPhone: merchant.contactPhone,
        status: merchant.status,
      },
    };
  }

  @Patch()
  async patch(@CurrentUser() user: JwtPayload, @Body() dto: PatchMerchantBusinessDto) {
    this.portal.assertOwner(user);
    const merchant = await this.portal.getMerchantForUser(user);
    const updated = await this.prisma.merchant.update({
      where: { id: merchant.id },
      data: {
        name: dto.name,
        description: dto.description,
        address: dto.address,
        contactPhone: dto.contactPhone,
      },
    });
    return { data: updated };
  }
}
