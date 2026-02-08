import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateFormDto {
  @IsOptional()
  @IsString()
  @Length(1, 120)
  title?: string;

  @IsOptional()
  @IsString()
  @Length(1, 500)
  description?: string;

  @IsOptional()
  @IsString()
  @Length(1, 80)
  slug?: string;
}
