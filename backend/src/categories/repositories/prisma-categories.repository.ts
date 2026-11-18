import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service.js';
import {
  CategoryNameConflictError,
  CategoriesRepository,
  CreateCategoryData,
  UpdateCategoryData,
} from './categories.repository.js';

@Injectable()
export class PrismaCategoriesRepository extends CategoriesRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(data: CreateCategoryData) {
    try {
      return await this.prisma.category.create({ data });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new CategoryNameConflictError();
      }

      throw error;
    }
  }

  findById(id: string) {
    return this.prisma.category.findUnique({ where: { id } });
  }

  findMany() {
    return this.prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
  }

  update(id: string, data: UpdateCategoryData) {
    return this.prisma.category.update({
      where: { id },
      data,
    });
  }

  delete(id: string) {
    return this.prisma.category.delete({ where: { id } });
  }
}
