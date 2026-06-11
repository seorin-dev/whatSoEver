import { describe, it, expect } from 'vitest';
import { buildRecommendation } from './recommend';
import { scoreFoods } from './scoring';
import { FOODS } from './foods';
import { analyzeTeam } from './saju';

const members = [
  { name: '철수', birthDate: '1993-05-14', birthHour: 12 },
  { name: '영희', birthDate: '1996-11-02', birthHour: null },
];
const analysis = analyzeTeam('팀', members, new Date(2026, 5, 11));
const candidates = scoreFoods(analysis, FOODS, 'seed').slice(0, 8);

describe('buildRecommendation', () => {
  it('LLM이 유효한 JSON을 주면 source=llm', async () => {
    const llmJson = JSON.stringify({
      top3: candidates.slice(0, 3).map((c) => ({ id: c.id, comment: '드립' })),
      summary: '총평',
      pairComment: { best: 'b', worst: 'w' },
    });
    const r = await buildRecommendation(analysis, candidates, async () => llmJson, 'seed');
    expect(r.source).toBe('llm');
    expect(r.top3[0].name).toBe(candidates[0].name); // id→음식 정보 매핑 확인
  });
  it('LLM 호출 실패 시 폴백', async () => {
    const r = await buildRecommendation(
      analysis, candidates, async () => { throw new Error('down'); }, 'seed',
    );
    expect(r.source).toBe('fallback');
    expect(r.top3).toHaveLength(3);
  });
  it('LLM이 깨진 JSON을 주면 폴백', async () => {
    const r = await buildRecommendation(analysis, candidates, async () => 'not json', 'seed');
    expect(r.source).toBe('fallback');
  });
  it('LLM이 없는 음식 id를 주면 폴백', async () => {
    const bad = JSON.stringify({
      top3: [{ id: 'ghost-food', comment: 'x' }], summary: 's',
      pairComment: { best: 'b', worst: 'w' },
    });
    const r = await buildRecommendation(analysis, candidates, async () => bad, 'seed');
    expect(r.source).toBe('fallback');
  });
  it('타임아웃 시 폴백', async () => {
    const slow = () => new Promise<string>((res) => setTimeout(() => res('{}'), 50));
    const r = await buildRecommendation(analysis, candidates, slow, 'seed', 10);
    expect(r.source).toBe('fallback');
  });
});
