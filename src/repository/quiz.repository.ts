import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Quiz } from '../models/quizzes.entity';

@Injectable()
export class QuizRepository {
  constructor(
    @InjectRepository(Quiz)
    private readonly quizRepo: Repository<Quiz>,
    private readonly dataSource: DataSource,
  ) {}

  async findByCourse(courseId: number): Promise<Quiz[]> {
    return this.quizRepo.find({
      where: { course: { id: courseId } },
      relations: ['createdBy'],
      order: { createdAt: 'ASC' },
    });
  }

  async findAllForLecturer(lecturerId: number, isHoD: boolean): Promise<Quiz[]> {
    const qb = this.quizRepo.createQueryBuilder('quiz')
      .leftJoinAndSelect('quiz.course', 'course')
      .leftJoinAndSelect('quiz.createdBy', 'createdBy')
      .leftJoinAndSelect('quiz.questions', 'questions');

    if (!isHoD) {
      // ✅ Cho phép xem quiz nếu là người tạo HOẶC là giảng viên được phân công vào khóa học đó
      qb.andWhere(
        '(createdBy.userId = :lecturerId OR EXISTS (' +
          'SELECT 1 FROM course_instructors ci WHERE ci.course_id = course.id AND ci.instructor_id = :lecturerId' +
        '))',
        { lecturerId },
      );
    }

    return qb.orderBy('quiz.createdAt', 'DESC').getMany();
  }

  async findById(id: number): Promise<Quiz | null> {
    return this.quizRepo.findOne({
      where: { id },
      relations: ['course', 'createdBy'],
    });
  }

  async findByIdWithQuestions(id: number): Promise<Quiz | null> {
    return this.quizRepo.findOne({
      where: { id },
      relations: ['course', 'createdBy', 'questions'],
    });
  }

  async create(data: Partial<Quiz>): Promise<Quiz> {
    const entity = this.quizRepo.create(data);
    return this.quizRepo.save(entity);
  }

  async update(id: number, data: Partial<Quiz>): Promise<Quiz | null> {
    await this.quizRepo.update(id, data);
    return this.findById(id);
  }

  async delete(id: number): Promise<void | null> {
    await this.quizRepo.delete(id);
  }
}