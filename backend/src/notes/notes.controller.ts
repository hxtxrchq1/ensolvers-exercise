import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Note } from '@prisma/client';
import { CreateNoteDto } from './dto/create-note.dto';
import { ListNotesQueryDto } from './dto/list-notes-query.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { NotesService } from './notes.service';

@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get('archived')
  listArchived(): Promise<Note[]> {
    return this.notesService.listArchived();
  }

  @Get()
  listActive(@Query() query: ListNotesQueryDto): Promise<Note[]> {
    return this.notesService.listActive(query.categoryId);
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.notesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateNoteDto): Promise<Note> {
    return this.notesService.create(dto);
  }

  @Patch(':id/archive')
  archive(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.notesService.archive(id);
  }

  @Patch(':id/unarchive')
  unarchive(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.notesService.unarchive(id);
  }

  @Post(':id/categories/:categoryId')
  @HttpCode(HttpStatus.NO_CONTENT)
  assignCategory(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('categoryId', new ParseUUIDPipe({ version: '4' }))
    categoryId: string,
  ): Promise<void> {
    return this.notesService.assignCategory(id, categoryId);
  }

  @Delete(':id/categories/:categoryId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeCategory(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('categoryId', new ParseUUIDPipe({ version: '4' }))
    categoryId: string,
  ): Promise<void> {
    return this.notesService.removeCategory(id, categoryId);
  }

  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateNoteDto,
  ): Promise<Note> {
    return this.notesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<void> {
    return this.notesService.delete(id);
  }
}
