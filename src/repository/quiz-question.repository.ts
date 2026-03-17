import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuizQuestion } from '../models/quiz-question.entity';

/**
 * Repository cho bảng quiz_questions
 * Câu hỏi là thực thể yếu phụ thuộc vào quizzes (CASCADE DELETE)
 *
 * DB: quiz_questions(id, quiz_id, question_text, options JSONB,
 *                    correct_answer, score_weight, order_index)
 */
@Injectable()
export class QuizQuestionRepository {
  constructor(
    @InjectRepository(QuizQuestion)
    private readonly questionRepo: Repository<QuizQuestion>,
  ) {}

  /**
   * Lấy tất cả câu hỏi của một bài kiểm tra, sắp xếp theo thứ tự
   * Phục vụ: Xem chi tiết bài kiểm tra / Học viên làm bài
   */
  async findByQuiz(quizId: number): Promise<QuizQuestion[]> {
    return this.questionRepo.find({
      where: { quiz: { id: quizId } },
      order: { orderIndex: 'ASC' },
    });
  }

  /**
   * Tìm câu hỏi theo ID (kèm quiz để kiểm tra quyền)
   */
  async findById(id: number): Promise<QuizQuestion | null> {
    return this.questionRepo.findOne({
      where: { id },
      relations: ['quiz', 'quiz.createdBy'],
    });
  }

  /**
   * Tìm orderIndex lớn nhất trong quiz để tự động gán thứ tự kế tiếp
   */
  async findMaxOrderIndex(quizId: number): Promise<number> {
    const result = await this.questionRepo
      .createQueryBuilder('question')
      .select('MAX(question.orderIndex)', 'maxOrderIndex')
      .where('question.quiz_id = :quizId', { quizId })
      .getRawOne();
    return parseInt(result?.maxOrderIndex, 10) || 0;
  }

  /**
   * Tạo câu hỏi mới
   * SRS: "Thêm câu hỏi mới (text, lựa chọn, đáp án đúng)"
   */
  async create(data: Partial<QuizQuestion>): Promise<QuizQuestion> {
    const entity = this.questionRepo.create(data);
    return this.questionRepo.save(entity);
  }

  /**
   * Cập nhật câu hỏi (nội dung, lựa chọn, đáp án, trọng số, thứ tự)
   * SRS: "Chỉnh sửa câu hỏi hiện có"
   */
  async update(id: number, data: Partial<QuizQuestion>): Promise<QuizQuestion | null> {
    await this.questionRepo.update(id, data as any);
    return this.findById(id);
  }

  /**
   * Cập nhật thứ tự hiển thị của câu hỏi
   * SRS: Thứ tự câu hỏi trong bài kiểm tra
   */
  async updateOrderIndex(id: number, orderIndex: number): Promise<QuizQuestion | null> {
    await this.questionRepo.update(id, { orderIndex });
    return this.findById(id);
  }

  /**
   * Xóa câu hỏi
   * SRS: "Xóa câu hỏi không cần thiết"
   * Lưu ý: điểm số tự động tính lại ở service nếu cần
   */
  async delete(id: number): Promise<void> {
    await this.questionRepo.delete(id);
  }

  /**
   * Đếm số câu hỏi trong một bài kiểm tra
   * Dùng để tính tổng điểm hoặc validate trước khi publish
   */
  async countByQuiz(quizId: number): Promise<number> {
    return this.questionRepo.count({
      where: { quiz: { id: quizId } },
    });
  }
}