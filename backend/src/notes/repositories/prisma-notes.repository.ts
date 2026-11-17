import { Injectable } from '@nestjs/common';
import { Note, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  ArchiveStateUpdate,
  CreateNoteData,
  NotesRepository,
  RelatedNoteOrCategoryNotFoundError,
  UpdateNoteData,
} from './notes.repository';

@Injectable()
export class PrismaNotesRepository extends NotesRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  create(data: CreateNoteData): Promise<Note> {
    return this.prisma.note.create({ data });
  }

  findById(id: string): Promise<Note | null> {
    return this.prisma.note.findUnique({ where: { id } });
  }

  findMany(isArchived: boolean, categoryId?: string): Promise<Note[]> {
    return this.prisma.note.findMany({
      where: {
        isArchived,
        ...(categoryId ? { categories: { some: { id: categoryId } } } : {}),
      },
      include: { categories: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async assignCategory(noteId: string, categoryId: string): Promise<void> {
    try {
      await this.prisma.note.update({
        where: { id: noteId },
        data: { categories: { connect: { id: categoryId } } },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new RelatedNoteOrCategoryNotFoundError();
      }

      throw error;
    }
  }

  async removeCategory(noteId: string, categoryId: string): Promise<boolean> {
    try {
      return await this.prisma.$transaction(async (transaction) => {
        const association = await transaction.note.findFirst({
          where: {
            id: noteId,
            categories: { some: { id: categoryId } },
          },
          select: { id: true },
        });

        if (!association) {
          return false;
        }

        await transaction.note.update({
          where: { id: noteId },
          data: { categories: { disconnect: { id: categoryId } } },
        });

        return true;
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        return false;
      }

      throw error;
    }
  }

  async update(id: string, data: UpdateNoteData): Promise<Note | null> {
    const result = await this.prisma.note.updateMany({
      where: { id },
      data,
    });

    return result.count === 0 ? null : this.findById(id);
  }

  async updateArchiveState(
    id: string,
    currentState: boolean,
    nextState: boolean,
  ): Promise<ArchiveStateUpdate> {
    const result = await this.prisma.note.updateMany({
      where: { id, isArchived: currentState },
      data: { isArchived: nextState },
    });

    return {
      updated: result.count > 0,
      note: await this.findById(id),
    };
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.prisma.note.deleteMany({ where: { id } });

    return result.count > 0;
  }
}
