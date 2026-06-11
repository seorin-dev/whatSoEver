import { describe, it, expect } from 'vitest';
import { scoreFoods } from './scoring';
import { FOODS } from './foods';
import type { ElementKey } from './saju/types';

const fireExcess = { excess: ['fire'] as ElementKey[], lacking: ['water'] as ElementKey[] };

describe('scoreFoods', () => {
  it('부족 기운(수) 음식이 과다 기운(화) 음식보다 높은 점수', () => {
    const scored = scoreFoods(fireExcess, FOODS, 'seed');
    const mul = scored.find((f) => f.id === 'mul-naengmyeon')!;
    const buldak = scored.find((f) => f.id === 'buldak')!;
    expect(mul.score).toBeGreaterThan(buldak.score);
  });
  it('점수 내림차순 정렬', () => {
    const scored = scoreFoods(fireExcess, FOODS, 'seed');
    for (let i = 1; i < scored.length; i++) {
      expect(scored[i - 1].score).toBeGreaterThanOrEqual(scored[i].score);
    }
  });
  it('excludeIds는 결과에서 제외된다', () => {
    const scored = scoreFoods(fireExcess, FOODS, 'seed', ['mul-naengmyeon']);
    expect(scored.find((f) => f.id === 'mul-naengmyeon')).toBeUndefined();
  });
  it('같은 시드면 같은 순서 (결정적)', () => {
    expect(scoreFoods(fireExcess, FOODS, 'x')).toEqual(scoreFoods(fireExcess, FOODS, 'x'));
  });
});
