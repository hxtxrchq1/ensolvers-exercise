import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class CreateNoteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @Matches(/\S/, { message: 'title no puede estar vacío.' })
  title!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'content no puede estar vacío.' })
  content!: string;
}
