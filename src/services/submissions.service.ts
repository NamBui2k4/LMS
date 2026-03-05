import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { SubmissionRepository } from '../repository/submissions.repository';
import { QuizRepository } from '../repository/quiz.repository';
import { Submission } from '../models/submission.entity';
import { SubmissionStatus } from '../common/enums/submission-status.enum';
import { IsOptional, IsNumber, IsString } from 'class-validator';

export class CreateSubmissionDto {
  answerData?: any;
}

export class GradeSubmissionDto {
  @IsNumber()
  score: number;

  @IsOptional()
  @IsString()
  note?: string;
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

  async findByStudent(studentId: string): Promise<Submission[]> {
    return this.submissionRepo.findByStudent(studentId);
  }

  async findOne(id: number): Promise<Submission> {
    const submission = await this.submissionRepo.findById(id);
    if (!submission) throw new NotFoundException('Không tìm thấy bài nộp.');
    return submission;
  }

  async submit(quizId: number, studentId: string, dto: CreateSubmissionDto): Promise<Submission> {
    const quiz = await this.quizRepo.findById(quizId);
    if (!quiz) throw new NotFoundException('Không tìm thấy bài kiểm tra.');

    const existing = await this.submissionRepo.findByQuizAndStudent(quizId, studentId);
    if (existing) throw new ConflictException('Học viên đã nộp bài kiểm tra này.');

    return this.submissionRepo.create({
      quiz: { id: quizId } as any,
      student: { id: studentId } as any,
      answerData: dto.answerData,
      status: SubmissionStatus.SUBMITTED,
    });
  }

  async grade(id: number, dto: GradeSubmissionDto, lecturerId: number): Promise<Submission> {
    const submission = await this.findOne(id);
    const updated = await this.submissionRepo.update(id, {
      score: dto.score,
      status: SubmissionStatus.GRADED,
      gradedAt: new Date(),
      gradedBy: { id: lecturerId } as any,
    });
    return updated!;
  }

  async requestRegrade(id: number, note: string, studentId: string): Promise<Submission> {
    const submission = await this.findOne(id);
    if (submission.student?.id !== studentId)
      throw new ForbiddenException('Bạn không có quyền yêu cầu phúc khảo bài này.');
    if (submission.status !== SubmissionStatus.GRADED)
      throw new ForbiddenException('Chỉ có thể yêu cầu phúc khảo bài đã được chấm điểm.');
    const updated = await this.submissionRepo.update(id, {
      regradeRequested: true,
      regradeNote: note,
    });
    return updated!;
  }
}