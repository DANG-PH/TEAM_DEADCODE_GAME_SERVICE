import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Challenge_Entity } from './challenge.entity';

@Entity('submissions')
export class Submission_Entity {

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  auth_id: number; // FK logic sang Auth/Player service

  @ManyToOne(() => Challenge_Entity, (challenge) => challenge.submissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'challenge_id' })
  challenge: Challenge_Entity;

  @Column({ type: 'text' })
  code: string;

  @Column({ default: 'python' })
  language: string;

  @Column({ default: false })
  passed: boolean;

  @Column({ default: 0 })
  score: number;

  @Column({ type: 'text', nullable: true })
  feedback: string;

  @Column({ default: 0 })
  line_count: number;

  @Column({ default: 0 })
  execution_ms: number;

  @CreateDateColumn()
  submitted_at: Date;
}