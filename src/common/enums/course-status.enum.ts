// DB: CREATE TYPE course_status AS ENUM ('draft', 'pending', 'published', 'closed', 'archived');
// LƯU Ý: Các giá trị PLANNED_TO_OPEN, OPEN_FOR_ENROLLMENT, CANCELLED không tồn tại trong DB.
// Quy trình SRS: draft → pending → published → closed / archived
export enum CourseStatus {
  DRAFT     = 'draft',
  PENDING   = 'pending',
  PUBLISHED = 'published',
  CLOSED    = 'closed',
  ARCHIVED  = 'archived',
}