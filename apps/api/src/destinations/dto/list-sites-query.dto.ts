import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ParticipationLevel, SiteCategory } from '@tp/db';

export class ListSitesQueryDto {
  @IsOptional()
  @IsEnum(ParticipationLevel)
  participationLevel?: ParticipationLevel;

  @IsOptional()
  @IsEnum(SiteCategory)
  category?: SiteCategory;
}
