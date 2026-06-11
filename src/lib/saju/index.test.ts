import { describe, it, expect } from 'vitest';
import { analyzeTeam } from './index';

const members = [
  { name: '철수', birthDate: '1993-05-14', birthHour: 12 },
  { name: '영희', birthDate: '1996-11-02', birthHour: null },
  { name: '민수', birthDate: '1989-08-23', birthHour: 7 },
];

describe('analyzeTeam', () => {
  it('전체 분석 결과를 조립한다', () => {
    const a = analyzeTeam('개발1팀', members, new Date(2026, 5, 11));
    expect(a.teamName).toBe('개발1팀');
    expect(a.members).toHaveLength(3);
    expect(a.iljin.ganZhi).toHaveLength(2);
    expect(a.bestPair.score).toBeGreaterThanOrEqual(a.worstPair.score);
    const pctTotal = Object.values(a.teamPct).reduce((x, y) => x + y, 0);
    expect(pctTotal).toBeGreaterThanOrEqual(98);
  });
  it('날짜가 다르면 teamPct가 달라질 수 있다 (일진 반영 확인)', () => {
    const a = analyzeTeam('t', members, new Date(2026, 5, 11));
    const b = analyzeTeam('t', members, new Date(2026, 5, 12));
    expect(a.iljin.ganZhi).not.toBe(b.iljin.ganZhi);
    // 일진 가중이 실제 결과에 반영되는지 — 가중이 no-op이면 이 단언이 잡아낸다
    // (2026-06-11=丙辰 fire+earth, 06-12=丁巳 fire+fire로 오행 구성이 다른 날짜 고정)
    expect(a.teamPct).not.toEqual(b.teamPct);
  });
  it('멤버 1명이면 throw', () => {
    expect(() => analyzeTeam('t', members.slice(0, 1), new Date())).toThrow();
  });
});
