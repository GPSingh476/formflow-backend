import { IsArray, IsString } from 'class-validator';

export class ReorderFieldsDto {
  @IsArray()
  @IsString({ each: true })
  orderedIds: string[];
}
