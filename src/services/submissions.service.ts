import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { SubmissionRepository } from '../repository/submissions.repository';
import { QuizRepository } from '../repository/quiz.repository';
import { Submission } from '../models/submission.entity';
import { SubmissionStatus } from '../common/enums/submission-status.enum';
import { IsOptional, IsNumber, IsString, IsNotEmpty, Min } from 'class-validator';

export class CreateSubmissionDto {
  answerData?: any;
}

export class GradeSubmissionDto {
  @IsNumber()
  @Min(0)
  score: number;

  @IsOptional()
  @IsString()
  note?: string;
}

export class RequestRegradeDto {
  @IsString()
  @IsNotEmpty()
  note: string;
}

@Injectable()
export class SubmissionService {
  constructor(
    private readonly submissionRepo: SubmissionRepository,
    private readonly quizRepo: QuizRepository,
  ) {}

  async findByQuiz(quizId: number): Promise<Submission[]> {
    const quiz = await this.quizRepo.findById(quizId);
    if (!quiz) throw new NotFoundException('Không tìm thấy bài kiểm tra.');
    return this.submissionRepo.findByQuiz(quizId);
  }

  async findAllByLecturer(lecturerId: number, role: string): Promise<Submission[]> {
    const isHoD = role === 'HEAD_OF_DEPARTMENT';
    return this.submissionRepo.findAllForLecturer(lecturerId, isHoD);
  }

  // ✅ FIX: studentId là number (userId), không phải string
  async findByStudent(studentId: number): Promise<Submission[]> {
    return this.submissionRepo.findByStudent(studentId);
  }

  async findOne(id: number): Promise<Submission> {
    const submission = await this.submissionRepo.findById(id);
    if (!submission) throw new NotFoundException('Không tìm thấy bài nộp.');
    return submission;
  }

  // ✅ FIX: studentId là number
  async submit(quizId: number, studentId: number, dto: CreateSubmissionDto): Promise<Submission> {
    const quiz = await this.quizRepo.findById(quizId);
    if (!quiz) throw new NotFoundException('Không tìm thấy bài kiểm tra.');

    const existing = await this.submissionRepo.findByQuizAndStudent(quizId, studentId);
    if (existing) throw new ConflictException('Học viên đã nộp bài kiểm tra này.');

    return this.submissionRepo.create({
      quiz:      { id: quizId } as any,
      // ✅ FIX: student PK là userId
      student:   { userId: studentId } as any,
      answerData: dto.answerData,
      status:    SubmissionStatus.SUBMITTED,
    });
  }

  // ✅ FIX: lecturerId là number (userId), không phải string
  async grade(id: number, dto: GradeSubmissionDto, lecturerId: number): Promise<Submission> {
    const submission = await this.findOne(id);
    if (submission.status === SubmissionStatus.GRADED) {
      throw new ConflictException('Bài nộp này đã được chấm điểm rồi.');
    }

    const updated = await this.submissionRepo.update(id, {
      score:     dto.score,
      status:    SubmissionStatus.GRADED,
      gradedAt:  new Date(),
      // ✅ FIX: Lecturer PK là userId
      gradedBy:  { userId: lecturerId } as any,
    });
    return updated!;
  }

  /**
   * Học viên yêu cầu phúc khảo
   * ✅ FIX: SubmissionStatus.UNDER_REVIEW (không phải PENDING_REVIEW — không tồn tại trong DB)
   * ✅ FIX: so sánh student.userId (không phải student.id)
   */
  async requestRegrade(id: number, note: string, studentId: number): Promise<Submission> {
    const submission = await this.findOne(id);

    // ✅ FIX: so sánh userId
    if (Number(submission.student?.userId) !== studentId)
      throw new ForbiddenException('Bạn không có quyền yêu cầu phúc khảo bài này.');

    if (submission.status !== SubmissionStatus.GRADED)
      throw new BadRequestException('Chỉ có thể yêu cầu phúc khảo bài đã được chấm điểm.');

    // ✅ FIX: UNDER_REVIEW (không phải PENDING_REVIEW)
    const updated = await this.submissionRepo.update(id, {
      regradeRequested: true,
      regradeNote:      note,
      status:           SubmissionStatus.UNDER_REVIEW,
    });
    return updated!;
  }
}