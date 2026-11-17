import { Module } from '@nestjs/common';
import { CategoriesModule } from '../categories/categories.module';
import { DatabaseModule } from '../database/database.module';
import { NotesController } from './notes.controller';
import { NotesRepository } from './repositories/notes.repository';
import { PrismaNotesRepository } from './repositories/prisma-notes.repository';
import { NotesService } from './notes.service';

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
