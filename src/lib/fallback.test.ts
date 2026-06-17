import { describe, it, expect } from 'vitest';
import { buildFallback } from './fallback';
import { scoreFoods } from './scoring';
import { FOODS } from './foods';
import { analyzeTeam } from './saju';

const members = [
  { name: '철수', birthDate: '1993-05-14', birthHour: 12 },
  { name: '영희', birthDate: '1996-11-02', birthHour: null },
];

describe('buildFallback', () => {
  it('상위 3개 메뉴와 모든 해설 필드를 채운다', () => {
    const analysis = analyzeTeam('팀', members, new Date(2026, 5, 11));
    const candidates = scoreFoods(analysis, FOODS, 'seed').slice(0, 8);
    const r = buildFallback(analysis, candidates, 'seed');
    expect(r.top3).toHaveLength(3);
    expect(r.top3[0].id).toBe(candidates[0].id); // 1위 = 최고 점수
    for (const t of r.top3) expect(t.comment.length).toBeGreaterThan(0);
    expect(r.summary.length).toBeGreaterThan(0);
    // 팀 운세에는 오늘 일진 간지가, 토픽에는 럭키/대화 안내가 들어간다
    expect(r.teamFortune).toContain(analysis.iljin.ganZhi);
    expect(r.teamTopic.length).toBeGreaterThan(0);
    expect(r.source).toBe('fallback');
  });
  it('같은 시드면 같은 결과 (결정적)', () => {
    const analysis = analyzeTeam('팀', members, new Date(2026, 5, 11));
    const candidates = scoreFoods(analysis, FOODS, 's').slice(0, 8);
    expect(buildFallback(analysis, candidates, 's'))
      .toEqual(buildFallback(analysis, candidates, 's'));
  });
});
