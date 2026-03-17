// ✅ FIX: DB định nghĩa: CREATE TYPE submission_status AS ENUM ('submitted', 'graded', 'under_review')
// ❌ SAI CŨ: REJECTED = 'rejected' và PENDING_REVIEW = 'pending_review' — không tồn tại trong DB
// ✅ ĐÚNG: chỉ 3 giá trị theo DB
export enum SubmissionStatus {
  SUBMITTED    = 'submitted',
  GRADED       = 'graded',
  UNDER_REVIEW = 'under_review', // ← đổi từ PENDING_REVIEW / REJECTED → UNDER_REVIEW
}