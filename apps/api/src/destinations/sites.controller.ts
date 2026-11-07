import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { JwtPayload } from '../auth/jwt-auth.guard';
import { DestinationsService } from './destinations.service';

@Controller('sites')
export class SitesController {
  constructor(private readonly destinations: DestinationsService) {}

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  async get(@Param('id') id: string, @Req() req: Request & { user?: JwtPayload }) {
    const data = await this.destinations.getSite(id, req.user);
    return { data };
  }
}
