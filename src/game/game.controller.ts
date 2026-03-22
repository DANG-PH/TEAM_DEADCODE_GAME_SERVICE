import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { GameService } from './game.service';
import { GameAdminService } from './game.admin.service';
import { GAME_SERVICE_NAME } from 'proto/game.pb';
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
  AdminCreateLevelRequest,          AdminCreateLevelResponse,
  AdminUpdateLevelRequest,          AdminUpdateLevelResponse,
  AdminDeleteLevelRequest,          AdminDeleteLevelResponse,
  AdminGetAllLevelsRequest,         AdminGetAllLevelsResponse,
  AdminCreateChallengeRequest,      AdminCreateChallengeResponse,
  AdminUpdateChallengeRequest,      AdminUpdateChallengeResponse,
  AdminDeleteChallengeRequest,      AdminDeleteChallengeResponse,
  AdminGetChallengesByLevelRequest, AdminGetChallengesByLevelResponse,
  AdminCreateHintRequest,           AdminCreateHintResponse,
  AdminDeleteHintRequest,           AdminDeleteHintResponse,
  AdminGetHintsByChallengeRequest,  AdminGetHintsByChallengeResponse,
} from 'proto/game.pb';

@Controller()
export class GameController {
  constructor(
    private readonly gameService:      GameService,
    private readonly gameAdminService: GameAdminService,
  ) {}

  // ------------------------------------------------------------------ Level
  @GrpcMethod(GAME_SERVICE_NAME, 'GetLevels')
  getLevels(data: GetLevelsRequest): Promise<GetLevelsResponse> {
    return this.gameService.getLevels(data);
  }

  @GrpcMethod(GAME_SERVICE_NAME, 'GetLevelDetail')
  getLevelDetail(data: GetLevelDetailRequest): Promise<GetLevelDetailResponse> {
    return this.gameService.getLevelDetail(data);
  }

  // ------------------------------------------------------------------ Challenge
  @GrpcMethod(GAME_SERVICE_NAME, 'GetChallenge')
  getChallenge(data: GetChallengeRequest): Promise<GetChallengeResponse> {
    return this.gameService.getChallenge(data);
  }

  @GrpcMethod(GAME_SERVICE_NAME, 'GetHint')
  getHint(data: GetHintRequest): Promise<GetHintResponse> {
    return this.gameService.getHint(data);
  }

  @GrpcMethod(GAME_SERVICE_NAME, 'SubmitAnswer')
  submitAnswer(data: SubmitAnswerRequest): Promise<SubmitAnswerResponse> {
    return this.gameService.submitAnswer(data);
  }

  // ------------------------------------------------------------------ Progress
  @GrpcMethod(GAME_SERVICE_NAME, 'GetProgress')
  getProgress(data: GetProgressRequest): Promise<GetProgressResponse> {
    return this.gameService.getProgress(data);
  }

  @GrpcMethod(GAME_SERVICE_NAME, 'StartLevel')
  startLevel(data: StartLevelRequest): Promise<StartLevelResponse> {
    return this.gameService.startLevel(data);
  }

  @GrpcMethod(GAME_SERVICE_NAME, 'CompleteLevel')
  completeLevel(data: CompleteLevelRequest): Promise<CompleteLevelResponse> {
    return this.gameService.completeLevel(data);
  }

  // ------------------------------------------------------------------ Code execution
  @GrpcMethod(GAME_SERVICE_NAME, 'RunCode')
  runCode(data: RunCodeRequest): Promise<RunCodeResponse> {
    console.log("HELLO3")
    return this.gameService.runCode(data);
  }

  @GrpcMethod(GAME_SERVICE_NAME, 'ValidateCode')
  validateCode(data: ValidateCodeRequest): Promise<ValidateCodeResponse> {
    return this.gameService.validateCode(data);
  }

  // ------------------------------------------------------------------ Admin: Level
  @GrpcMethod(GAME_SERVICE_NAME, 'AdminGetAllLevels')
  adminGetAllLevels(data: AdminGetAllLevelsRequest): Promise<AdminGetAllLevelsResponse> {
    return this.gameAdminService.adminGetAllLevels(data);
  }

  @GrpcMethod(GAME_SERVICE_NAME, 'AdminCreateLevel')
  adminCreateLevel(data: AdminCreateLevelRequest): Promise<AdminCreateLevelResponse> {
    return this.gameAdminService.adminCreateLevel(data);
  }

  @GrpcMethod(GAME_SERVICE_NAME, 'AdminUpdateLevel')
  adminUpdateLevel(data: AdminUpdateLevelRequest): Promise<AdminUpdateLevelResponse> {
    return this.gameAdminService.adminUpdateLevel(data);
  }

  @GrpcMethod(GAME_SERVICE_NAME, 'AdminDeleteLevel')
  adminDeleteLevel(data: AdminDeleteLevelRequest): Promise<AdminDeleteLevelResponse> {
    return this.gameAdminService.adminDeleteLevel(data);
  }

  // ------------------------------------------------------------------ Admin: Challenge
  @GrpcMethod(GAME_SERVICE_NAME, 'AdminGetChallengesByLevel')
  adminGetChallengesByLevel(data: AdminGetChallengesByLevelRequest): Promise<AdminGetChallengesByLevelResponse> {
    return this.gameAdminService.adminGetChallengesByLevel(data);
  }

  @GrpcMethod(GAME_SERVICE_NAME, 'AdminCreateChallenge')
  adminCreateChallenge(data: AdminCreateChallengeRequest): Promise<AdminCreateChallengeResponse> {
    return this.gameAdminService.adminCreateChallenge(data);
  }

  @GrpcMethod(GAME_SERVICE_NAME, 'AdminUpdateChallenge')
  adminUpdateChallenge(data: AdminUpdateChallengeRequest): Promise<AdminUpdateChallengeResponse> {
    return this.gameAdminService.adminUpdateChallenge(data);
  }

  @GrpcMethod(GAME_SERVICE_NAME, 'AdminDeleteChallenge')
  adminDeleteChallenge(data: AdminDeleteChallengeRequest): Promise<AdminDeleteChallengeResponse> {
    return this.gameAdminService.adminDeleteChallenge(data);
  }

  // ------------------------------------------------------------------ Admin: Hint
  @GrpcMethod(GAME_SERVICE_NAME, 'AdminGetHintsByChallenge')
  adminGetHintsByChallenge(data: AdminGetHintsByChallengeRequest): Promise<AdminGetHintsByChallengeResponse> {
    return this.gameAdminService.adminGetHintsByChallenge(data);
  }

  @GrpcMethod(GAME_SERVICE_NAME, 'AdminCreateHint')
  adminCreateHint(data: AdminCreateHintRequest): Promise<AdminCreateHintResponse> {
    return this.gameAdminService.adminCreateHint(data);
  }

  @GrpcMethod(GAME_SERVICE_NAME, 'AdminDeleteHint')
  adminDeleteHint(data: AdminDeleteHintRequest): Promise<AdminDeleteHintResponse> {
    return this.gameAdminService.adminDeleteHint(data);
  }

  @GrpcMethod(GAME_SERVICE_NAME, 'AdminGetTestCasesByChallenge') adminGetTestCasesByChallenge(data: any) { return this.gameAdminService.adminGetTestCasesByChallenge(data); }

  @GrpcMethod(GAME_SERVICE_NAME, 'AdminCreateTestCase')adminCreateTestCase(data: any) { return this.gameAdminService.adminCreateTestCase(data); }

  @GrpcMethod(GAME_SERVICE_NAME, 'AdminDeleteTestCase') dminDeleteTestCase(data: any) { return this.gameAdminService.adminDeleteTestCase(data); }
}