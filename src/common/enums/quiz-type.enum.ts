// ✅ FIX: DB định nghĩa: CREATE TYPE quiz_type AS ENUM ('multiple_choice', 'essay')
// ❌ SAI CŨ: MIXED = 'mixed' — không tồn tại trong DB
// ✅ ĐÚNG: chỉ 2 giá trị theo DB
export enum QuizType {
  MULTIPLE_CHOICE = 'multiple_choice',
  ESSAY           = 'essay',
  // MIXED đã bị xóa — không có trong DB schema
}