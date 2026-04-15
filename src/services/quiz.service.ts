import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { QuizRepository } from '../repository/quiz.repository';
import { CourseRepository } from '../repository/course.repository';
import { Quiz } from '../models/quizzes.entity';
import { QuizType } from '../common/enums/quiz-type.enum';
import { IsString, IsEnum, IsOptional, IsNumber, IsNotEmpty, Min } from 'class-validator';
import { InjectRepository } from '@nestjs/typeorm';

/**
 * ✅ FIX: QuizType chỉ còn MULTIPLE_CHOICE | ESSAY (bỏ MIXED)
 */
export class CreateQuizDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsEnum(QuizType)
  quizType: QuizType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxScore?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  passScore?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  durationMin?: number;
}

export class UpdateQuizDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxScore?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  passScore?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  durationMin?: number;
}

@Injectable()
export class QuizService {
  constructor(
    private readonly quizRepo: QuizRepository,
    private readonly courseRepo: CourseRepository,
  ) {}

  async findByCourse(courseId: number): Promise<Quiz[]> {
    const course = await this.courseRepo.findById(courseId);
    if (!course) throw new NotFoundException('Không tìm thấy khóa học.');
    return this.quizRepo.findByCourse(courseId);
  }

  async findAllByLecturer(lecturerId: number, role: string): Promise<Quiz[]> {
    const isHoD = role === 'HEAD_OF_DEPARTMENT';
    return this.quizRepo.findAllForLecturer(lecturerId, isHoD);
  }

  async findOne(id: number): Promise<Quiz> {
    const quiz = await this.quizRepo.findByIdWithQuestions(id);
    if (!quiz) throw new NotFoundException('Không tìm thấy bài kiểm tra.');
    return quiz;
  }

  async create(courseId: number, dto: CreateQuizDto, lecturerId: number): Promise<Quiz> {
    const course = await this.courseRepo.findById(courseId);
    if (!course) throw new NotFoundException('Không tìm thấy khóa học.');

    // ✅ FIX: so sánh userId
    if (Number(course.createdBy?.userId) !== lecturerId)
      throw new ForbiddenException('Bạn không có quyền thêm bài kiểm tra vào khóa học này.');

    return this.quizRepo.create({
      ...dto,
      course:     { id: courseId } as any,
      // ✅ FIX: Lecturer PK là userId
      createdBy:  { userId: lecturerId } as any,
    });
  }

  async update(id: number, dto: UpdateQuizDto, lecturerId: number): Promise<Quiz> {
    const quiz = await this.quizRepo.findById(id);
    if (!quiz) throw new NotFoundException('Không tìm thấy bài kiểm tra.');

    // ✅ FIX: so sánh userId
    if (Number(quiz.createdBy?.userId) !== lecturerId)
      throw new ForbiddenException('Bạn không có quyền chỉnh sửa bài kiểm tra này.');

    const updated = await this.quizRepo.update(id, dto);
    return updated!;
  }

  async delete(id: number, lecturerId: number): Promise<void> {
    const quiz = await this.quizRepo.findById(id);
    if (!quiz) throw new NotFoundException('Không tìm thấy bài kiểm tra.');

    // ✅ FIX: so sánh userId
    if (Number(quiz.createdBy?.userId) !== lecturerId)
      throw new ForbiddenException('Bạn không có quyền xóa bài kiểm tra này.');

    await this.quizRepo.delete(id);
  }
}