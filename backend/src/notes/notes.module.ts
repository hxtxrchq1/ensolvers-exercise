import { Module } from '@nestjs/common';
import { CategoriesModule } from '../categories/categories.module.js';
import { DatabaseModule } from '../database/database.module.js';
import { NotesController } from './notes.controller.js';
import { NotesRepository } from './repositories/notes.repository.js';
import { PrismaNotesRepository } from './repositories/prisma-notes.repository.js';
import { NotesService } from './notes.service.js';

@Module({
  imports: [DatabaseModule, CategoriesModule],
  controllers: [NotesController],
  providers: [
    NotesService,
    {
      provide: NotesRepository,
      useClass: PrismaNotesRepository,
    },
  ],
})
export class NotesModule {}
