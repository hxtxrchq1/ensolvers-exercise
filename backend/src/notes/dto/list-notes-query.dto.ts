import { IsOptional, IsUUID } from 'class-validator';

export class ListNotesQueryDto {
  @IsOptional()
  @IsUUID('4')
  categoryId?: string;
}
