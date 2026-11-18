import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Note } from '@prisma/client';
import { CategoriesRepository } from '../categories/repositories/categories.repository.js';
import {
  CreateNoteData,
  NotesRepository,
  RelatedNoteOrCategoryNotFoundError,
  UpdateNoteData,
} from './repositories/notes.repository.js';

@Injectable()
export class NotesService {
  constructor(
    protected readonly repository: NotesRepository,
    protected readonly categoriesRepository: CategoriesRepository,
  ) {}

  create(data: CreateNoteData): Promise<Note> {
    return this.repository.create(data);
  }

  async listActive(categoryId?: string): Promise<Note[]> {
    if (categoryId && !(await this.categoriesRepository.findById(categoryId))) {
      throw new NotFoundException('No se encontró la categoría.');
    }

    return this.repository.findMany(false, categoryId);
  }

  listArchived(): Promise<Note[]> {
    return this.repository.findMany(true);
  }

  async findOne(id: string): Promise<Note> {
    const note = await this.repository.findById(id);

    if (!note) {
      throw new NotFoundException('No se encontró la nota.');
    }

    return note;
  }

  async update(id: string, data: UpdateNoteData): Promise<Note> {
    if (data.title === undefined && data.content === undefined) {
      throw new BadRequestException(
        'Debe proporcionar title o content para editar la nota.',
      );
    }

    const note = await this.repository.update(id, data);

    if (!note) {
      throw new NotFoundException('No se encontró la nota.');
    }

    return note;
  }

  async archive(id: string): Promise<Note> {
    return this.updateArchiveState(id, false, true, 'archivar');
  }

  async unarchive(id: string): Promise<Note> {
    return this.updateArchiveState(id, true, false, 'desarchivar');
  }

  async assignCategory(noteId: string, categoryId: string): Promise<void> {
    await this.requireNote(noteId);
    await this.requireCategory(categoryId);

    try {
      await this.repository.assignCategory(noteId, categoryId);
    } catch (error) {
      if (error instanceof RelatedNoteOrCategoryNotFoundError) {
        throw new NotFoundException('No se encontró la nota o la categoría.');
      }

      throw error;
    }
  }

  async removeCategory(noteId: string, categoryId: string): Promise<void> {
    await this.requireNote(noteId);
    await this.requireCategory(categoryId);

    const removed = await this.repository.removeCategory(noteId, categoryId);

    if (!removed) {
      throw new NotFoundException('La categoría no está asociada a la nota.');
    }
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);

    if (!deleted) {
      throw new NotFoundException('No se encontró la nota.');
    }
  }

  private async updateArchiveState(
    id: string,
    currentState: boolean,
    nextState: boolean,
    action: 'archivar' | 'desarchivar',
  ): Promise<Note> {
    const result = await this.repository.updateArchiveState(
      id,
      currentState,
      nextState,
    );

    if (!result.note) {
      throw new NotFoundException('No se encontró la nota.');
    }

    if (!result.updated) {
      throw new BadRequestException(
        `No se puede ${action} una nota que ya está ${
          currentState ? 'archivada' : 'activa'
        }.`,
      );
    }

    return result.note;
  }

  private async requireNote(id: string): Promise<void> {
    if (!(await this.repository.findById(id))) {
      throw new NotFoundException('No se encontró la nota.');
    }
  }

  private async requireCategory(id: string): Promise<void> {
    if (!(await this.categoriesRepository.findById(id))) {
      throw new NotFoundException('No se encontró la categoría.');
    }
  }
}
