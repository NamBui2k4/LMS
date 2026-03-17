// DB: CREATE TYPE enrollment_status AS ENUM ('enrolled', 'in_progress', 'completed', 'dropped');
export enum EnrollmentStatus {
  ENROLLED    = 'enrolled',
  IN_PROGRESS = 'in_progress',
  COMPLETED   = 'completed',
  DROPPED     = 'dropped',
}