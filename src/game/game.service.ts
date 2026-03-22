import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { firstValueFrom } from 'rxjs';

import { Level_Entity } from './level.entity';
import { Challenge_Entity } from './challenge.entity';
import { Hint_Entity } from './hint.entity';
import { Progress_Entity } from './progress.entity';
import { Submission_Entity } from './submission.entity';
import { CodeExecutionService } from './code-execution.service';

import type {
  GetLevelsRequest,      GetLevelsResponse,
  GetLevelDetailRequest, GetLevelDetailResponse,
  GetChallengeRequest,   GetChallengeResponse,
  GetHintRequest,        GetHintResponse,
  SubmitAnswerRequest,   SubmitAnswerResponse,
  GetProgressRequest,    GetProgressResponse,
  StartLevelRequest,     StartLevelResponse,
  CompleteLevelRequest,  CompleteLevelResponse,
  RunCodeRequest,        RunCodeResponse,
  ValidateCodeRequest,   ValidateCodeResponse,
} from 'proto/game.pb';

import { PLAYER_PACKAGE_NAME, PLAYER_SERVICE_NAME, PlayerServiceClient } from 'proto/user.pb';
import type { ClientGrpc } from '@nestjs/microservices';

@Injectable()
export class GameService implements OnModuleInit {
  private playerService: PlayerServiceClient;

  constructor(
    @InjectRepository(Level_Entity)
    private readonly levelRepo: Repository<Level_Entity>,

    @InjectRepository(Challenge_Entity)
    private readonly challengeRepo: Repository<Challenge_Entity>,

    @InjectRepository(Hint_Entity)
    private readonly hintRepo: Repository<Hint_Entity>,

    @InjectRepository(Progress_Entity)
    private readonly progressRepo: Repository<Progress_Entity>,

    @InjectRepository(Submission_Entity)
    private readonly submissionRepo: Repository<Submission_Entity>,

    private readonly codeExecutionService: CodeExecutionService,

    @Inject(PLAYER_PACKAGE_NAME) private readonly playerClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.playerService = this.playerClient.getService<PlayerServiceClient>(PLAYER_SERVICE_NAME);
  }

  // ------------------------------------------------------------------ Level

  async getLevels(data: GetLevelsRequest): Promise<GetLevelsResponse> {
    const levels = await this.levelRepo.find({
      where: { is_active: true },
      order: { order: 'ASC' },
      relations: ['challenges'],
    });

    const progresses = await this.progressRepo.find({
      where: { auth_id: data.auth_id },
      relations: ['level'],
    });

    const progressMap = new Map(progresses.map((p) => [p.level.id, p]));

    const result = levels.map((level, index) => {
      const progress    = progressMap.get(level.id);
      const prevLevel   = levels[index - 1];
      const prevProgress = prevLevel ? progressMap.get(prevLevel.id) : null;
      const is_unlocked = index === 0 || (prevProgress?.is_completed ?? false);

      return {
        id:              level.id,
        name:            level.name,
        description:     level.description,
        is_unlocked,
        is_completed:    progress?.is_completed ?? false,
        challenge_count: level.challenges.length,
      };
    });

    return { levels: result };
  }

  async getLevelDetail(data: GetLevelDetailRequest): Promise<GetLevelDetailResponse> {
    const level = await this.levelRepo.findOne({
      where: { id: data.level_id },
      relations: ['challenges'],
    });
    if (!level) throw new RpcException({ code: status.NOT_FOUND, message: 'Level not found' });

    const submissions = await this.submissionRepo.find({
      where: { auth_id: data.auth_id },
      relations: ['challenge'],
    });
    const passedSet = new Set(submissions.filter((s) => s.passed).map((s) => s.challenge.id));

    const prevLevel = await this.levelRepo.findOne({ where: { order: level.order - 1 } });
    let is_unlocked = level.order === 1;
    if (prevLevel) {
      const prevProgress = await this.progressRepo.findOne({
        where: { auth_id: data.auth_id, level: { id: prevLevel.id } },
        relations: ['level'],
      });
      is_unlocked = prevProgress?.is_completed ?? false;
    }

    return {
      id:          level.id,
      name:        level.name,
      description: level.description,
      story:       level.story ?? '',
      is_unlocked,
      challenges:  level.challenges
        .sort((a, b) => a.order - b.order)
        .map((c) => ({
          id:           c.id,
          title:        c.title,
          type:         c.type,
          is_completed: passedSet.has(c.id),
        })),
    };
  }

  // ------------------------------------------------------------------ Challenge

  async getChallenge(data: GetChallengeRequest): Promise<GetChallengeResponse> {
    const challenge = await this.challengeRepo.findOne({
      where: { id: data.challenge_id },
      relations: ['level', 'hints'],
    });
    if (!challenge) throw new RpcException({ code: status.NOT_FOUND, message: 'Challenge not found' });

    return {
      id:           challenge.id,
      level_id:     challenge.level.id,
      title:        challenge.title,
      description:  challenge.description,
      type:         challenge.type,
      starter_code: challenge.starter_code ?? '',
      max_score:    challenge.max_score,
      hint_count:   challenge.hints.length,
    };
  }

  async getHint(data: GetHintRequest): Promise<GetHintResponse> {
    const hint = await this.hintRepo.findOne({
      where: { challenge: { id: data.challenge_id }, index: data.hint_index },
      relations: ['challenge'],
    });
    if (!hint) throw new RpcException({ code: status.NOT_FOUND, message: 'Hint not found' });

    const total = await this.hintRepo.count({ where: { challenge: { id: data.challenge_id } } });

    return { hint: hint.content, is_last: data.hint_index >= total - 1 };
  }

  async submitAnswer(data: SubmitAnswerRequest): Promise<SubmitAnswerResponse> {
    const challenge = await this.challengeRepo.findOne({
      where: { id: data.challenge_id },
      relations: ['level'],
    });
    if (!challenge) throw new RpcException({ code: status.NOT_FOUND, message: 'Challenge not found' });

    const alreadyPassed = await this.submissionRepo.findOne({
      where: { auth_id: data.auth_id, challenge: { id: data.challenge_id }, passed: true },
      relations: ['challenge'],
    });
    if (alreadyPassed) throw new RpcException({ code: status.ALREADY_EXISTS, message: 'Already passed this challenge' });

    const validated = await this.validateCode({
      challenge_id: data.challenge_id,
      code:         data.code,
      language:     data.language,
    });

    const submission = this.submissionRepo.create({
      auth_id:      data.auth_id,
      challenge,
      code:         data.code,
      language:     data.language,
      passed:       validated.passed,
      score:        validated.score,
      feedback:     validated.feedback,
      line_count:   validated.line_count,
      execution_ms: 0,
    });
    await this.submissionRepo.save(submission);

    if (validated.passed) {
      await this._updateProgressOnPass(data.auth_id, challenge, validated.score);
    }

    return {
      passed:       validated.passed,
      score:        validated.score,
      feedback:     validated.feedback,
      line_count:   validated.line_count,
      execution_ms: submission.execution_ms,
      test_results: validated.test_results,
    };
  }

  // ------------------------------------------------------------------ Progress

  async getProgress(data: GetProgressRequest): Promise<GetProgressResponse> {
    const levels = await this.levelRepo.find({
      where: { is_active: true },
      order: { order: 'ASC' },
      relations: ['challenges'],
    });

    const progresses = await this.progressRepo.find({
      where: { auth_id: data.auth_id },
      relations: ['level'],
    });

    const progressMap = new Map(progresses.map((p) => [p.level.id, p]));

    let total_score      = 0;
    let levels_completed = 0;

    const result = levels.map((level) => {
      const progress = progressMap.get(level.id);
      if (progress?.is_completed) levels_completed++;
      total_score += progress?.score ?? 0;

      return {
        level_id:         level.id,
        level_name:       level.name,
        is_completed:     progress?.is_completed    ?? false,
        challenges_done:  progress?.challenges_done ?? 0,
        challenges_total: level.challenges.length,
        score:            progress?.score           ?? 0,
        time_spent:       progress?.time_spent      ?? 0,
      };
    });

    return { levels: result, total_score, levels_completed };
  }

  async startLevel(data: StartLevelRequest): Promise<StartLevelResponse> {
    const level = await this.levelRepo.findOne({ where: { id: data.level_id } });
    if (!level) throw new RpcException({ code: status.NOT_FOUND, message: 'Level not found' });

    const existing = await this.progressRepo.findOne({
      where: { auth_id: data.auth_id, level: { id: data.level_id } },
      relations: ['level'],
    });
    if (existing) return { success: true, started_at: existing.started_at.toISOString() };

    const progress = this.progressRepo.create({ auth_id: data.auth_id, level });
    await this.progressRepo.save(progress);

    return { success: true, started_at: progress.started_at.toISOString() };
  }

  async completeLevel(data: CompleteLevelRequest): Promise<CompleteLevelResponse> {
    const progress = await this.progressRepo.findOne({
      where: { auth_id: data.auth_id, level: { id: data.level_id } },
      relations: ['level'],
    });
    if (!progress) throw new RpcException({ code: status.NOT_FOUND, message: 'Progress not found' });

    progress.is_completed = true;
    progress.score        = data.score;
    progress.time_spent   = data.time_spent;
    await this.progressRepo.save(progress);

    const currentLevel = await this.levelRepo.findOne({ where: { id: data.level_id } });
    if (!currentLevel) throw new RpcException({ code: status.NOT_FOUND, message: 'Level not found' });

    const nextLevel = await this.levelRepo.findOne({ where: { order: currentLevel.order + 1 } });

    return {
      success:             true,
      next_level_unlocked: !!nextLevel,
      next_level_id:       nextLevel?.id ?? 0,
    };
  }

  // ------------------------------------------------------------------ Code execution

  async runCode(data: RunCodeRequest): Promise<RunCodeResponse> {
    return this.codeExecutionService.runCode(data);
  }

  async validateCode(data: ValidateCodeRequest): Promise<ValidateCodeResponse> {
    return this.codeExecutionService.validateCode(data);
  }

  // ------------------------------------------------------------------ Private
private async _updateProgressOnPass(
  auth_id:   number,
  challenge: Challenge_Entity,
  score:     number,
): Promise<void> {
  const level = await this.levelRepo.findOne({
    where: { id: challenge.level.id },
    relations: ['challenges'],
  });
  if (!level) return;

  let progress = await this.progressRepo.findOne({
    where: { auth_id, level: { id: level.id } },
    relations: ['level'],
  });

  if (!progress) {
    progress                 = new Progress_Entity();
    progress.auth_id         = auth_id;
    progress.level           = level;
    progress.challenges_done = 0;
    progress.score           = 0;
  }

  const passedCount = await this.submissionRepo.count({
    where: {
      auth_id,
      challenge: { level: { id: level.id } },
      passed: true,
    },
    relations: ['challenge', 'challenge.level'],
  });

  console.log('passedCount:', passedCount, '| total:', level.challenges.length)

  progress.challenges_done = passedCount;
  progress.score           = (progress.score ?? 0) + score;
  progress.is_completed    = passedCount >= level.challenges.length;

  console.log('progress before save:', {
    challenges_done: progress.challenges_done,
    score: progress.score,
    is_completed: progress.is_completed,
  })

  await this.progressRepo.save(progress);

  if (progress.is_completed) {
    console.log('Level completed! Calling AddScore...')
    try {
      const result = await firstValueFrom(
        this.playerService.addScore({
          auth_id,
          level_id:   level.id,
          level_name: level.name,
          score:      progress.score,
          time_spent: progress.time_spent ?? 0,
        }),
      );
      console.log('AddScore result:', JSON.stringify(result))
    } catch (err) {
      console.error('AddScore failed:', err)
    }
  } else {
    console.log('Level NOT completed:', passedCount, '/', level.challenges.length)
  }
}
}