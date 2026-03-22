import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Challenge_Entity } from './challenge.entity';

@Entity('levels')
export class Level_Entity {

  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text', nullable: true })
  story: string;

  @Column({ default: 1 })
  order: number; // thứ tự unlock: 1 -> 2 -> 3

  @Column({ default: true })
  is_active: boolean;

  @OneToMany(() => Challenge_Entity, (challenge) => challenge.level, { cascade: true })
  challenges: Challenge_Entity[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}