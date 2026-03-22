import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Challenge_Entity } from './challenge.entity';

@Entity('test_cases')
export class TestCase_Entity {

  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Challenge_Entity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'challenge_id' })
  challenge: Challenge_Entity;

  @Column({ type: 'text' })
  input: string;       // stdin truyền vào khi chạy code

  @Column({ type: 'text' })
  expected_output: string;  // output mong đợi (trim whitespace khi so sánh)

  @Column({ default: 1 })
  order: number;
}