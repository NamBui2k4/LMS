import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Student } from './student.entity'; // import ngược lại
import { Course } from './courses.entity';

@Entity('enrollments')
export class Enrollment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Student, (user) => user.enrollments)
  student: Student;

  @ManyToOne(() => Course, (course) => course.enrollments)
  course: Course;

  // ... các field khác như progressPercentage, status...
}