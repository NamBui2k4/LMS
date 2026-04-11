// src/modules/category/category.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { Category } from '../models/categories.entity';
import { Courses } from '../models/courses.entity';

// Controllers
import { CategoryController } from '../controller/categories.controller';

// Services
import { CategoryService } from '../services/categories.service';

// Repositories
import { CategoryRepository } from '../repository/categories.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Category, Courses])],
  controllers: [CategoryController],
  providers: [CategoryService, CategoryRepository],
  exports: [CategoryService, CategoryRepository],
})
export class CategoryModule {}