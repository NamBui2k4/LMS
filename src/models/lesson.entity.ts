import {Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany} from 'typeorm'
import {Course} from './courses.entity'
import {Material} from './material.entity'

@Entity('lessons')
export class Lesson {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text', { nullable: true })
  content?: string;  // text mô tả hoặc markdown

  @ManyToOne(() => Course, course => course.lessons, { onDelete: 'CASCADE' })
  course: Course;

  @Column({ default: 0 })
  order: number;  // thứ tự trong khóa học

  @OneToMany(() => Material, material => material.lesson, { cascade: true })
  materials: Material[];
}