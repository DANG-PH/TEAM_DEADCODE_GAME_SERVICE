import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique
} from 'typeorm';
import { Level_Entity } from './level.entity';

@Entity('progresses')
@Unique(['auth_id', 'level'])  
export class Progress_Entity {

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  auth_id: number; // FK logic sang Auth/Player service

  @ManyToOne(() => Level_Entity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'level_id' })
  level: Level_Entity;

  @Column({ default: false })
  is_completed: boolean;

  @Column({ default: 0 })
  challenges_done: number;

  @Column({ default: 0 })
  score: number;

  @Column({ default: 0 })
  time_spent: number; // seconds

  @CreateDateColumn()
  started_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}