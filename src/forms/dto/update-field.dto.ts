import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateFieldDto {
  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @IsOptional()
  @IsString()
  placeholder?: string;

  @IsOptional()
  options?: any;
}
