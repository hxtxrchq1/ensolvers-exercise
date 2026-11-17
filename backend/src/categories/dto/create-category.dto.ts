import { IsOptional, IsString, Matches } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @Matches(/\S/, { message: 'name no puede estar vacío.' })
  name!: string;

  @IsOptional()
  @IsString()
  color?: string | null;
}
