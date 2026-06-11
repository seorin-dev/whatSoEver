import { describe, it, expect } from 'vitest';
import { pairScore, findPairs } from './compat';
import type { MemberSaju } from './types';
import { emptyDist } from './types';

function fakeMember(name: string, dayGanElement: MemberSaju['dayGanElement']): MemberSaju {
  return { name, dayGan: '?', dayGanElement, pillarGlyphs: [], dist: emptyDist() };
}

describe('궁합 점수', () => {
  it('상생(목→화)은 +2', () => {
    expect(pairScore(fakeMember('a', 'wood'), fakeMember('b', 'fire'))).toBe(2);
  });
  it('상극(수↔화)은 -2', () => {
    expect(pairScore(fakeMember('a', 'water'), fakeMember('b', 'fire'))).toBe(-2);
  });
  it('동일 오행은 +1', () => {
    expect(pairScore(fakeMember('a', 'earth'), fakeMember('b', 'earth'))).toBe(1);
  });
});

describe('최고/최악 페어', () => {
  it('전체 쌍에서 최고와 최악을 찾는다', () => {
    const members = [
      fakeMember('철수', 'wood'),  // 철수-영희: 상생 +2
      fakeMember('영희', 'fire'),  // 영희-민수: 상극 -2 (수극화)
      fakeMember('민수', 'water'), // 철수-민수: 상생 +2 (수생목)
    ];
    const { best, worst } = findPairs(members);
    expect(worst.a).toBe('영희');
    expect(worst.b).toBe('민수');
    expect(worst.score).toBe(-2);
    expect(best.score).toBe(2);
  });

  it('동점 best는 먼저 나온 쌍을 반환한다', () => {
    const members = [
      fakeMember('a', 'wood'),
      fakeMember('b', 'fire'),   // a-b: generates +2
      fakeMember('c', 'water'),  // a-c: generated +2 (tie)
    ];
    const { best } = findPairs(members);
    expect(best.a).toBe('a');
    expect(best.b).toBe('b');   // first-encountered wins
  });

  it('동점 worst는 먼저 나온 쌍을 반환한다', () => {
    const members = [
      fakeMember('a', 'fire'),
      fakeMember('b', 'water'),  // a-b: water-controls-fire -2
      fakeMember('c', 'metal'),  // a-c: metal-controls-fire -2 (tie)
    ];
    const { worst } = findPairs(members);
    expect(worst.a).toBe('a');
    expect(worst.b).toBe('b');   // first-encountered wins
  });

  it('2명 미만이면 에러를 던진다', () => {
    const single = [fakeMember('혼자', 'wood')];
    expect(() => findPairs(single)).toThrow('멤버는 2명 이상이어야 합니다');

    const empty: typeof single = [];
    expect(() => findPairs(empty)).toThrow('멤버는 2명 이상이어야 합니다');
  });
});
