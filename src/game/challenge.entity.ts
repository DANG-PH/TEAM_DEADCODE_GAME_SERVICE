import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Level_Entity } from './level.entity';
import { Submission_Entity } from './submission.entity';
import { Hint_Entity } from './hint.entity';

export enum ChallengeType {
  VARIABLE  = 'variable',
  CONDITION = 'condition',
  LOOP      = 'loop',
}

@Entity('challenges')
export class Challenge_Entity {

  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Level_Entity, (level) => level.challenges, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'level_id' })
  level: Level_Entity;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: ChallengeType })
  type: ChallengeType;

  @Column({ type: 'text', nullable: true })
  starter_code: string;

  @Column({ default: 100 })
  max_score: number;

  @Column({ default: 1 })
  order: number; // thứ tự trong level

  @OneToMany(() => Hint_Entity, (hint) => hint.challenge, { cascade: true })
  hints: Hint_Entity[];

  @OneToMany(() => Submission_Entity, (submission) => submission.challenge, { cascade: true })
  submissions: Submission_Entity[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
