import {Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany} from 'typeorm'
import {MaterialType} from '../common/enums/material-type.enum'
import {Lesson} from "./lesson.entity"
@Entity('materials')
export class Material {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  fileUrl: string;  // path hoặc URL (S3 sau này)

  @Column({ type: 'enum', enum: MaterialType })
  type: MaterialType;  // VIDEO | PDF | IMAGE | AUDIO | OTHER

  @ManyToOne(() => Lesson, lesson => lesson.materials, { onDelete: 'CASCADE' })
  lesson: Lesson;
}