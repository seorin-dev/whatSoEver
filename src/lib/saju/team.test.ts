import { describe, it, expect } from 'vitest';
import { sumDists, toPct, judge } from './team';
import { emptyDist } from './types';

function dist(partial: Partial<Record<string, number>>) {
  return { ...emptyDist(), ...partial } as ReturnType<typeof emptyDist>;
}

describe('팀 오행 합산', () => {
  it('멤버 분포를 합산한다', () => {
    const sum = sumDists([dist({ fire: 3, water: 1 }), dist({ fire: 2, wood: 2 })]);
    expect(sum.fire).toBe(5);
    expect(sum.wood).toBe(2);
    expect(sum.water).toBe(1);
  });
  it('백분율 합은 100 근처(반올림 오차 ±2)', () => {
    const pct = toPct(dist({ fire: 5, wood: 2, water: 1 }));
    const total = Object.values(pct).reduce((a, b) => a + b, 0);
    expect(total).toBeGreaterThanOrEqual(98);
    expect(total).toBeLessThanOrEqual(102);
  });
  it('35% 이상은 과다, 10% 이하는 부족', () => {
    // fire 8/16=50%, water 0/16=0%, wood 4, earth 4 (각 25%)
    const { excess, lacking } = judge(toPct(dist({ fire: 8, wood: 4, earth: 4 })));
    expect(excess).toContain('fire');
    expect(lacking).toContain('water');
    expect(lacking).toContain('metal');
    expect(excess).not.toContain('wood');
  });
});
