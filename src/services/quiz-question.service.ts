import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { QuizQuestionRepository } from '../repository/quiz-question.repository';
import { QuizRepository } from '../repository/quiz.repository';
import { QuizQuestion } from '../models/quiz-question.entity';
import { CreateQuizQuestionDto, UpdateQuizQuestionDto } from '../dto/quiz-question.dto';

/**
 * Service quản lý câu hỏi bài kiểm tra
 * Tác nhân chính: Giảng viên
 * SRS: "Thêm/chỉnh sửa/xóa câu hỏi — thêm câu hỏi mới (text, lựa chọn, đáp án đúng),
 *       chỉnh sửa câu hỏi hiện có, hoặc xóa câu hỏi không cần thiết"
 *
 * Luồng phân quyền:
 *   - Chỉ Giảng viên tạo quiz mới được thêm/sửa/xóa câu hỏi
 *   - Giảng viên và Trưởng bộ môn đều được XEM câu hỏi
 */
@Injectable()
export class QuizQuestionService {
  constructor(
    private readonly questionRepo: QuizQuestionRepository,
    private readonly quizRepo: QuizRepository,
  ) {}

  /**
   * Lấy danh sách câu hỏi của một bài kiểm tra
   * SRS: Xem chi tiết bài kiểm tra — danh sách câu hỏi
   * @param quizId ID bài kiểm tra
   */
  async findByQuiz(quizId: number): Promise<QuizQuestion[]> {
    const quiz = await this.quizRepo.findById(quizId);
    if (!quiz) throw new NotFoundException('Không tìm thấy bài kiểm tra.');
    return this.questionRepo.findByQuiz(quizId);
  }

  /**
   * Lấy chi tiết một câu hỏi
   * @param id ID câu hỏi
   */
  async findOne(id: number): Promise<QuizQuestion> {
    const question = await this.questionRepo.findById(id);
    if (!question) throw new NotFoundException('Không tìm thấy câu hỏi.');
    return question;
  }

  /**
   * Thêm câu hỏi mới vào bài kiểm tra
   * SRS: "Thêm câu hỏi mới (text, lựa chọn, đáp án đúng)"
   *
   * @param quizId ID bài kiểm tra
   * @param dto Dữ liệu câu hỏi mới
   * @param lecturerId userId của Giảng viên thực hiện (phải là người tạo quiz)
   */
  async create(
    quizId: number,
    dto: CreateQuizQuestionDto,
    lecturerId: number,
  ): Promise<QuizQuestion> {
    const quiz = await this.quizRepo.findById(quizId);
    if (!quiz) throw new NotFoundException('Không tìm thấy bài kiểm tra.');

    // Chỉ người tạo quiz mới được thêm câu hỏi
    if (Number(quiz.createdBy?.userId) !== lecturerId) {
      throw new ForbiddenException('Bạn không có quyền thêm câu hỏi vào bài kiểm tra này.');
    }

    // Validate: câu hỏi trắc nghiệm phải có options
    if (quiz.quizType === 'multiple_choice' && (!dto.options || dto.options.length === 0)) {
      throw new BadRequestException(
        'Bài kiểm tra trắc nghiệm phải có ít nhất một lựa chọn cho câu hỏi.',
      );
    }

    // Tự động tính orderIndex nếu không truyền
    const maxOrderIndex = await this.questionRepo.findMaxOrderIndex(quizId);
    const orderIndex = dto.orderIndex ?? maxOrderIndex + 1;

    return this.questionRepo.create({
      questionText:  dto.questionText,
      options:       dto.options,
      correctAnswer: dto.correctAnswer,
      scoreWeight:   dto.scoreWeight ?? 1.0,
      orderIndex,
      quiz: { id: quizId } as any,
    });
  }

  /**
   * Chỉnh sửa câu hỏi hiện có
   * SRS: "Chỉnh sửa câu hỏi hiện có"
   *
   * @param id ID câu hỏi
   * @param dto Dữ liệu cập nhật
   * @param lecturerId userId của Giảng viên thực hiện
   */
  async update(
    id: number,
    dto: UpdateQuizQuestionDto,
    lecturerId: number,
  ): Promise<QuizQuestion> {
    const question = await this.findOne(id);

    // Chỉ người tạo quiz mới được sửa câu hỏi
    if (Number(question.quiz?.createdBy?.userId) !== lecturerId) {
      throw new ForbiddenException('Bạn không có quyền chỉnh sửa câu hỏi này.');
    }

    const updated = await this.questionRepo.update(id, {
      ...(dto.questionText  !== undefined && { questionText:  dto.questionText }),
      ...(dto.options       !== undefined && { options:       dto.options }),
      ...(dto.correctAnswer !== undefined && { correctAnswer: dto.correctAnswer }),
      ...(dto.scoreWeight   !== undefined && { scoreWeight:   dto.scoreWeight }),
      ...(dto.orderIndex    !== undefined && { orderIndex:    dto.orderIndex }),
    });
    return updated!;
  }

  /**
   * Xóa câu hỏi
   * SRS: "Xóa câu hỏi không cần thiết"
   *       "Danh sách câu hỏi được cập nhật, điểm số tự động tính lại nếu cần"
   *
   * @param id ID câu hỏi
   * @param lecturerId userId của Giảng viên thực hiện
   */
  async delete(id: number, lecturerId: number): Promise<void> {
    const question = await this.findOne(id);

    // Chỉ người tạo quiz mới được xóa câu hỏi
    if (Number(question.quiz?.createdBy?.userId) !== lecturerId) {
      throw new ForbiddenException('Bạn không có quyền xóa câu hỏi này.');
    }

    await this.questionRepo.delete(id);
  }

  /**
   * Cập nhật thứ tự câu hỏi trong bài kiểm tra
   * Phục vụ chức năng sắp xếp lại câu hỏi
   *
   * @param id ID câu hỏi
   * @param orderIndex Thứ tự mới
   * @param lecturerId userId của Giảng viên thực hiện
   */
  async reorder(id: number, orderIndex: number, lecturerId: number): Promise<QuizQuestion> {
    const question = await this.findOne(id);

    if (Number(question.quiz?.createdBy?.userId) !== lecturerId) {
      throw new ForbiddenException('Bạn không có quyền sắp xếp câu hỏi này.');
    }

    const updated = await this.questionRepo.updateOrderIndex(id, orderIndex);
    return updated!;
  }
}