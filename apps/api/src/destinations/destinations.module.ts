import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DestinationsController } from './destinations.controller';
import { DestinationsService } from './destinations.service';
import { SitesController } from './sites.controller';

@Module({
  imports: [AuthModule],
  controllers: [DestinationsController, SitesController],
  providers: [DestinationsService],
  exports: [DestinationsService],
})
export class DestinationsModule {}
