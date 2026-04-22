// src/modules/material/material.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { Material } from '../models/material.entity';
import { Lesson } from '../models/lesson.entity';

// Controllers
import { MaterialController } from '../controller/material.controller';

// Services
import { MaterialService } from '../services/material.service';
import { SupabaseStorageService } from '../services/supabase-storage.service';

// Repositories
import { MaterialRepository } from '../repository/material.repository';
import { LessonModule } from './lesson.module';
import { CourseModule } from './course.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Material, Lesson]),
    LessonModule,
    CourseModule
  ],
  controllers: [MaterialController],
  providers: [MaterialService, MaterialRepository, SupabaseStorageService],
  exports: [MaterialService, MaterialRepository],
})
export class MaterialModule {}