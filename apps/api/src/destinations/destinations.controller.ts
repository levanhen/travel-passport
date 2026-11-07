import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { JwtPayload } from '../auth/jwt-auth.guard';
import { ListSitesQueryDto } from './dto/list-sites-query.dto';
import { DestinationsService } from './destinations.service';

@Controller('destinations')
export class DestinationsController {
  constructor(private readonly destinations: DestinationsService) {}

  @Get()
  async list() {
    const data = await this.destinations.listDestinations();
    return { data };
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    const data = await this.destinations.getDestination(id);
    return { data };
  }

  @Get(':id/sites')
  @UseGuards(OptionalJwtAuthGuard)
  async listSites(
    @Param('id') id: string,
    @Query() query: ListSitesQueryDto,
    @Req() req: Request & { user?: JwtPayload },
  ) {
    const data = await this.destinations.listSites(id, query, req.user);
    return { data, meta: { total: data.length } };
  }
}
