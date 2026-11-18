import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { CategoriesController } from './categories.controller.js';
import { CategoriesRepository } from './repositories/categories.repository.js';
import { PrismaCategoriesRepository } from './repositories/prisma-categories.repository.js';
import { CategoriesService } from './categories.service.js';

@Module({
  imports: [DatabaseModule],
  controllers: [CategoriesController],
  providers: [
    CategoriesService,
    {
      provide: CategoriesRepository,
      useClass: PrismaCategoriesRepository,
    },
  ],
  exports: [CategoriesRepository],
})
export class CategoriesModule {}
