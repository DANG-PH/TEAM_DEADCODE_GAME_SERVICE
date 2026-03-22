import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';

import { Level_Entity } from './level.entity';
import { Challenge_Entity, ChallengeType } from './challenge.entity';
import { Hint_Entity } from './hint.entity';
import { TestCase_Entity } from './test-case.entity';

import type {
  AdminCreateLevelRequest,    AdminCreateLevelResponse,
  AdminUpdateLevelRequest,    AdminUpdateLevelResponse,
  AdminDeleteLevelRequest,    AdminDeleteLevelResponse,
  AdminGetAllLevelsRequest,   AdminGetAllLevelsResponse,
  AdminCreateChallengeRequest, AdminCreateChallengeResponse,
  AdminUpdateChallengeRequest, AdminUpdateChallengeResponse,
  AdminDeleteChallengeRequest, AdminDeleteChallengeResponse,
  AdminGetChallengesByLevelRequest, AdminGetChallengesByLevelResponse,
  AdminCreateHintRequest,     AdminCreateHintResponse,
  AdminDeleteHintRequest,     AdminDeleteHintResponse,
  AdminGetHintsByChallengeRequest, AdminGetHintsByChallengeResponse,
} from 'proto/game.pb';

@Injectable()
export class GameAdminService {
  constructor(
    @InjectRepository(Level_Entity)
    private readonly levelRepo: Repository<Level_Entity>,

    @InjectRepository(Challenge_Entity)
    private readonly challengeRepo: Repository<Challenge_Entity>,

    @InjectRepository(Hint_Entity)
    private readonly hintRepo: Repository<Hint_Entity>,

    @InjectRepository(TestCase_Entity)
    private readonly testCaseRepo: Repository<TestCase_Entity>,
  ) {}

  // ------------------------------------------------------------------ Level

  async adminGetAllLevels(_: AdminGetAllLevelsRequest): Promise<AdminGetAllLevelsResponse> {
    const levels = await this.levelRepo.find({
      order:     { order: 'ASC' },
      relations: ['challenges'],
    });

    return {
      levels: levels.map((l) => ({
        id:              l.id,
        name:            l.name,
        description:     l.description,
        story:           l.story ?? '',
        order:           l.order,
        is_active:       l.is_active,
        challenge_count: l.challenges.length,
      })),
    };
  }

  async adminCreateLevel(data: AdminCreateLevelRequest): Promise<AdminCreateLevelResponse> {
    const level    = new Level_Entity();
    level.name        = data.name;
    level.description = data.description;
    level.story       = data.story ?? '';
    level.order       = data.order || 1;
    level.is_active   = true;

    await this.levelRepo.save(level);
    return { success: true, id: level.id };
  }

  async adminUpdateLevel(data: AdminUpdateLevelRequest): Promise<AdminUpdateLevelResponse> {
    const level = await this.levelRepo.findOne({ where: { id: data.id } });
    if (!level) throw new RpcException({ code: status.NOT_FOUND, message: 'Level not found' });

    if (data.name)        level.name        = data.name;
    if (data.description) level.description = data.description;
    if (data.story)       level.story       = data.story;
    if (data.order)       level.order       = data.order;
    level.is_active = data.is_active;

    await this.levelRepo.save(level);
    return { success: true };
  }

  async adminDeleteLevel(data: AdminDeleteLevelRequest): Promise<AdminDeleteLevelResponse> {
    const level = await this.levelRepo.findOne({ where: { id: data.id } });
    if (!level) throw new RpcException({ code: status.NOT_FOUND, message: 'Level not found' });

    await this.levelRepo.remove(level);
    return { success: true };
  }

  // ------------------------------------------------------------------ Challenge

  async adminGetChallengesByLevel(data: AdminGetChallengesByLevelRequest): Promise<AdminGetChallengesByLevelResponse> {
    const challenges = await this.challengeRepo.find({
      where:     { level: { id: data.level_id } },
      order:     { order: 'ASC' },
      relations: ['hints'],
    });

    return {
      challenges: challenges.map((c) => ({
        id:           c.id,
        title:        c.title,
        type:         c.type,
        description:  c.description,
        starter_code: c.starter_code ?? '',
        max_score:    c.max_score,
        order:        c.order,
        hint_count:   c.hints.length,
      })),
    };
  }

  async adminCreateChallenge(data: AdminCreateChallengeRequest): Promise<AdminCreateChallengeResponse> {
    const level = await this.levelRepo.findOne({ where: { id: data.level_id } });
    if (!level) throw new RpcException({ code: status.NOT_FOUND, message: 'Level not found' });

    const challenge          = new Challenge_Entity();
    challenge.level          = level;
    challenge.title          = data.title;
    challenge.description    = data.description;
    challenge.type           = data.type as ChallengeType;
    challenge.starter_code   = data.starter_code ?? '';
    challenge.max_score      = data.max_score || 100;
    challenge.order          = data.order || 1;

    await this.challengeRepo.save(challenge);
    return { success: true, id: challenge.id };
  }

  async adminUpdateChallenge(data: AdminUpdateChallengeRequest): Promise<AdminUpdateChallengeResponse> {
    const challenge = await this.challengeRepo.findOne({ where: { id: data.id } });
    if (!challenge) throw new RpcException({ code: status.NOT_FOUND, message: 'Challenge not found' });

    if (data.title)        challenge.title        = data.title;
    if (data.description)  challenge.description  = data.description;
    if (data.type)         challenge.type         = data.type as ChallengeType;
    if (data.starter_code) challenge.starter_code = data.starter_code;
    if (data.max_score)    challenge.max_score    = data.max_score;
    if (data.order)        challenge.order        = data.order;

    await this.challengeRepo.save(challenge);
    return { success: true };
  }

  async adminDeleteChallenge(data: AdminDeleteChallengeRequest): Promise<AdminDeleteChallengeResponse> {
    const challenge = await this.challengeRepo.findOne({ where: { id: data.id } });
    if (!challenge) throw new RpcException({ code: status.NOT_FOUND, message: 'Challenge not found' });

    await this.challengeRepo.remove(challenge);
    return { success: true };
  }

  // ------------------------------------------------------------------ Hint

  async adminGetHintsByChallenge(data: AdminGetHintsByChallengeRequest): Promise<AdminGetHintsByChallengeResponse> {
    const hints = await this.hintRepo.find({
      where: { challenge: { id: data.challenge_id } },
      order: { index: 'ASC' },
    });

    return {
      hints: hints.map((h) => ({
        id:      h.id,
        content: h.content,
        index:   h.index,
      })),
    };
  }

  async adminCreateHint(data: AdminCreateHintRequest): Promise<AdminCreateHintResponse> {
    const challenge = await this.challengeRepo.findOne({ where: { id: data.challenge_id } });
    if (!challenge) throw new RpcException({ code: status.NOT_FOUND, message: 'Challenge not found' });

    const hint       = new Hint_Entity();
    hint.challenge   = challenge;
    hint.content     = data.content;
    hint.index       = data.index;

    await this.hintRepo.save(hint);
    return { success: true, id: hint.id };
  }

  async adminDeleteHint(data: AdminDeleteHintRequest): Promise<AdminDeleteHintResponse> {
    const hint = await this.hintRepo.findOne({ where: { id: data.id } });
    if (!hint) throw new RpcException({ code: status.NOT_FOUND, message: 'Hint not found' });

    await this.hintRepo.remove(hint);
    return { success: true };
  }

  // ------------------------------------------------------------------ Test Case
  async adminGetTestCasesByChallenge(data: any): Promise<any> {
    const testCases = await this.testCaseRepo.find({
      where: { challenge: { id: data.challenge_id } },
      order: { order: 'ASC' },
    });
    return { test_cases: testCases.map((t) => ({ id: t.id, input: t.input, expected_output: t.expected_output, order: t.order })) };
  }

  async adminCreateTestCase(data: any): Promise<any> {
    const challenge = await this.challengeRepo.findOne({ where: { id: data.challenge_id } });
    if (!challenge) throw new RpcException({ code: status.NOT_FOUND, message: 'Challenge not found' });

    const tc          = new TestCase_Entity();
    tc.challenge      = challenge;
    tc.input          = data.input;
    tc.expected_output = data.expected_output;
    tc.order          = data.order ?? 1;

    await this.testCaseRepo.save(tc);
    return { success: true, id: tc.id };
  }

  async adminDeleteTestCase(data: any): Promise<any> {
    const tc = await this.testCaseRepo.findOne({ where: { id: data.id } });
    if (!tc) throw new RpcException({ code: status.NOT_FOUND, message: 'Test case not found' });
    await this.testCaseRepo.remove(tc);
    return { success: true };
  }
}