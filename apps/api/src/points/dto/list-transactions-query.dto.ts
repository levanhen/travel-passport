import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { PointTxnType } from '@tp/db';
import { Type } from 'class-transformer';

export class ListTransactionsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;

  @IsOptional()
  @IsEnum(PointTxnType)
  type?: PointTxnType;
}
