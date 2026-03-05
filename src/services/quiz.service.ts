import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { QuizRepository } from '../repository/quiz.repository';
import { CourseRepository } from '../repository/course.repository';
import { Quiz } from '../models/quizzes.entity';
import { QuizType } from '../common/enums/quiz-type.enum';
import { IsString, IsEnum, IsOptional, IsNumber, IsNotEmpty } from 'class-validator';

export class CreateQuizDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsEnum(QuizType)
  quizType: QuizType;

  @IsOptional()
  @IsNumber()
  maxScore?: number;

  @IsOptional()
  @IsNumber()
  passScore?: number;

  @IsOptional()
  @IsNumber()
  durationMin?: number;
}

export class UpdateQuizDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsNumber()
  maxScore?: number;

  @IsOptional()
  @IsNumber()
  passScore?: number;

  @IsOptional()
  @IsNumber()
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

  async findOne(id: number): Promise<Quiz> {
    const quiz = await this.quizRepo.findByIdWithQuestions(id);
    if (!quiz) throw new NotFoundException('Không tìm thấy bài kiểm tra.');
    return quiz;
  }

  async create(courseId: number, dto: CreateQuizDto, lecturerId: number): Promise<Quiz> {
    const course = await this.courseRepo.findById(courseId);
    if (!course) throw new NotFoundException('Không tìm thấy khóa học.');
    if (course.createdBy?.id !== lecturerId)
      throw new ForbiddenException('Bạn không có quyền thêm bài kiểm tra vào khóa học này.');

    return this.quizRepo.create({
      ...dto,
      course: { id: courseId } as any,
      createdBy: { id: lecturerId } as any,
    });
  }

  async update(id: number, dto: UpdateQuizDto, lecturerId: number): Promise<Quiz> {
    const quiz = await this.quizRepo.findById(id);
    if (!quiz) throw new NotFoundException('Không tìm thấy bài kiểm tra.');
    if (quiz.createdBy?.id !== lecturerId)
      throw new ForbiddenException('Bạn không có quyền chỉnh sửa bài kiểm tra này.');
    const updated = await this.quizRepo.update(id, dto);
    return updated!;
  }

  async delete(id: number, lecturerId: number): Promise<void> {
    const quiz = await this.quizRepo.findById(id);
    if (!quiz) throw new NotFoundException('Không tìm thấy bài kiểm tra.');
    if (quiz.createdBy?.id !== lecturerId)
      throw new ForbiddenException('Bạn không có quyền xóa bài kiểm tra này.');
    await this.quizRepo.delete(id);
  }
}