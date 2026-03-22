import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TestCase_Entity } from './test-case.entity';
import type { RunCodeRequest, RunCodeResponse, ValidateCodeRequest, ValidateCodeResponse } from 'proto/game.pb';

const JUDGE0_URL  = 'https://judge029.p.rapidapi.com';  // ← đổi URL
const JUDGE0_HOST = 'judge029.p.rapidapi.com';           // ← đổi host

const LANGUAGE_ID: Record<string, number> = {
  python:     71,  // Python 3.8.1
  javascript: 63,  // JavaScript (Node.js 12.14.0)
};

@Injectable()
export class CodeExecutionService {
  private readonly logger = new Logger(CodeExecutionService.name);
  private readonly apiKey = process.env.JUDGE0_API_KEY ?? '';

  constructor(
    @InjectRepository(TestCase_Entity)
    private readonly testCaseRepo: Repository<TestCase_Entity>,
  ) {}

  // ------------------------------------------------------------------ private

  private get headers() {
    return {
      'Content-Type':    'application/json',
      'X-RapidAPI-Key':  this.apiKey,
      'X-RapidAPI-Host': JUDGE0_HOST,
    };
  }

  private async execute(code: string, languageId: number, stdin: string): Promise<{
    stdout: string; stderr: string; exit_code: number; execution_ms: number; timed_out: boolean;
  }> {
    // 1. Submit bài
    const submitRes = await fetch(
      `${JUDGE0_URL}/submissions?base64_encoded=false&wait=false`,
      {
        method:  'POST',
        headers: this.headers,
        body: JSON.stringify({
          source_code:  code,
          language_id:  languageId,
          stdin:        stdin ?? '',
        }),
      },
    );

    const { token } = await submitRes.json();
    if (!token) throw new Error('Judge0: no token returned');

    // 2. Poll kết quả tối đa 10 lần, mỗi 800ms
    for (let i = 0; i < 10; i++) {
      await new Promise((r) => setTimeout(r, 800));

      const pollRes = await fetch(
        `${JUDGE0_URL}/submissions/${token}?base64_encoded=false`,
        { headers: this.headers },
      );
      const result = await pollRes.json();
      const statusId = result.status?.id;

      this.logger.log(`Poll ${i + 1}: status=${statusId} (${result.status?.description})`);

      // 1=In Queue, 2=Processing → chờ tiếp
      if (statusId <= 2) continue;

      return {
        stdout:       result.stdout             ?? '',
        stderr:       result.stderr             ?? result.compile_output ?? '',
        exit_code:    statusId === 3 ? 0 : 1,   // 3=Accepted
        execution_ms: Math.round((result.time ?? 0) * 1000),
        timed_out:    statusId === 5,            // 5=Time Limit Exceeded
      };
    }

    throw new Error('Judge0: polling timeout');
  }

  // ------------------------------------------------------------------ public

  async runCode(data: RunCodeRequest): Promise<RunCodeResponse> {
    const languageId = LANGUAGE_ID[data.language];
    if (!languageId) {
      return { stdout: '', stderr: `Ngôn ngữ không hỗ trợ: ${data.language}`, exit_code: 1, execution_ms: 0, timed_out: false };
    }

    try {
      const result = await this.execute(data.code, languageId, data.stdin ?? '');
      this.logger.log(`runCode done: exit=${result.exit_code} ms=${result.execution_ms}`);
      return result;
    } catch (err) {
      this.logger.error('Judge0 runCode error', err);
      return { stdout: '', stderr: 'Lỗi kết nối sandbox', exit_code: 1, execution_ms: 0, timed_out: false };
    }
  }

  async validateCode(data: ValidateCodeRequest): Promise<ValidateCodeResponse> {
    const languageId = LANGUAGE_ID[data.language];
    if (!languageId) {
      return { passed: false, feedback: `Ngôn ngữ không hỗ trợ: ${data.language}`, score: 0, line_count: 0, test_results: [] };
    }

    const testCases = await this.testCaseRepo.find({
      where: { challenge: { id: data.challenge_id } },
      order: { order: 'ASC' },
    });

    if (testCases.length === 0) {
      return { passed: false, feedback: 'Chưa có test case nào cho challenge này', score: 0, line_count: 0, test_results: [] };
    }

    const line_count = data.code.split('\n').filter((l) => l.trim()).length;
    const results: Array<{ input: string; expected: string; actual: string; passed: boolean }> = [];
    let passedCount = 0;

    for (const tc of testCases) {
      try {
        const result   = await this.execute(data.code, languageId, tc.input);
        const actual   = result.stdout.trim();
        const expected = tc.expected_output.trim();
        const passed   = actual === expected;

        this.logger.log(`TC ${tc.id}: actual="${actual}" expected="${expected}" passed=${passed}`);

        if (passed) passedCount++;
        results.push({ input: tc.input, expected, actual, passed });
      } catch (err) {
        this.logger.error(`TC ${tc.id} error`, err);
        results.push({ input: tc.input, expected: tc.expected_output.trim(), actual: '', passed: false });
      }
    }

    const allPassed = passedCount === testCases.length;
    const baseScore = allPassed ? 100 : Math.round((passedCount / testCases.length) * 100);
    const lineBonus = allPassed && line_count <= 3 ? 10 : 0;
    const score     = Math.min(100, baseScore + lineBonus);

    return {
      passed:   allPassed,
      feedback: allPassed
        ? `Chính xác! ${passedCount}/${testCases.length} test case pass.`
        : `${passedCount}/${testCases.length} test case pass. Kiểm tra lại logic nhé!`,
      score,
      line_count,
      test_results: results,
    };
  }
}