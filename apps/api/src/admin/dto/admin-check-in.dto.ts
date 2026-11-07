import { IsString, MaxLength, MinLength } from 'class-validator';

export class VoidCheckinDto {
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  voidReason!: string;
}
