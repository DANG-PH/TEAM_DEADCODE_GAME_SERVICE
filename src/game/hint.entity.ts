import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Challenge_Entity } from './challenge.entity';

@Entity('hints')
export class Hint_Entity {

  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Challenge_Entity, (challenge) => challenge.hints, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'challenge_id' })
  challenge: Challenge_Entity;

  @Column({ type: 'text' })
  content: string;

  @Column()
  index: number; // 0-based, map với hint_index trong proto
}