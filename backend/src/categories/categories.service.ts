import { ConflictException, Injectable } from '@nestjs/common';
import { Category } from '@prisma/client';
import { CreateCategoryDto } from './dto/create-category.dto';
import {
  CategoriesRepository,
  CategoryNameConflictError,
} from './repositories/categories.repository';

@Injectable()
export class CategoriesService {
  constructor(protected readonly repository: CategoriesRepository) {}

  async create(data: CreateCategoryDto): Promise<Category> {
    try {
      return await this.repository.create(data);
    } catch (error) {
      if (error instanceof CategoryNameConflictError) {
        throw new ConflictException('Ya existe una categoría con ese nombre.');
      }

      throw error;
    }
  }

  list(): Promise<Category[]> {
    return this.repository.findMany();
  }
}
