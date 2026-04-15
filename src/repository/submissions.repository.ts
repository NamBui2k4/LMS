import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Submission } from '../models/submission.entity';
import { SubmissionStatus } from '../common/enums/submission-status.enum';

@Injectable()
export class SubmissionRepository {
  constructor(
    @InjectRepository(Submission)
    private readonly submissionRepo: Repository<Submission>,
    private readonly dataSource: DataSource,
  ) {}

  async findByQuiz(quizId: number): Promise<Submission[]> {
    return this.submissionRepo.find({
      where: { quiz: { id: quizId } },
      relations: ['student', 'gradedBy'],
      order: { submittedAt: 'DESC' },
    });
  }

  // ✅ FIX 1: studentId: string → number
  // ✅ FIX 2: student: { id: studentId } → student: { userId: studentId }
  //           Student PK là userId (maps to DB column user_id), không phải id
  async findByStudent(studentId: number): Promise<Submission[]> {
    return this.submissionRepo.find({
      where: { student: { userId: studentId } },
      relations: ['quiz'],
      order: { submittedAt: 'DESC' },
    });
  }

  async findById(id: number): Promise<Submission | null> {
    return this.submissionRepo.findOne({
      where: { id },
      relations: [
        'quiz', 
        'quiz.course',             
        'quiz.course.createdBy',   // <--- Thêm cái này nếu cần kiểm tra chủ sở hữu
        'student', 
        'gradedBy'
      ],
    });
  }

  // ✅ FIX: studentId string → number; student.id → student.userId
  async findByQuizAndStudent(quizId: number, studentId: number): Promise<Submission | null> {
    return this.submissionRepo.findOne({
      where: { quiz: { id: quizId }, student: { userId: studentId } },
    });
  }

  async findPendingGrade(): Promise<Submission[]> {
    return this.submissionRepo.find({
      where: { status: SubmissionStatus.SUBMITTED },
      relations: ['quiz', 'student'],
      order: { submittedAt: 'ASC' },
    });
  }

  async findAllForLecturer(lecturerId: number, isHoD: boolean): Promise<Submission[]> {
    const qb = this.submissionRepo.createQueryBuilder('sub')
      .leftJoinAndSelect('sub.quiz', 'quiz')
      .leftJoinAndSelect('sub.student', 'student')
      .leftJoinAndSelect('quiz.course', 'course')
      .leftJoinAndSelect('course.createdBy', 'courseOwner');

    if (!isHoD) {
      // ✅ FIX: Một giảng viên có thể chấm bài nộp của khóa học họ TẠO hoặc họ được PHÂN CÔNG
      qb.andWhere(
        '(courseOwner.userId = :lecturerId OR EXISTS (' +
          'SELECT 1 FROM course_instructors ci WHERE ci.course_id = course.id AND ci.instructor_id = :lecturerId' +
        '))',
        { lecturerId },
      );
    }

    return qb.orderBy('sub.submittedAt', 'DESC').getMany();
  }

  async create(data: Partial<Submission>): Promise<Submission> {
    const entity = this.submissionRepo.create(data);
    return this.submissionRepo.save(entity);
  }

  async update(id: number, data: Partial<Submission>): Promise<Submission | null> {
    await this.submissionRepo.update(id, data);
    return this.findById(id);
  }
}