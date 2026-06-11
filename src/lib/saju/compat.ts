import type { MemberSaju, PairResult } from './types';
import { relation } from './elements';

export function pairScore(a: MemberSaju, b: MemberSaju): number {
  const rel = relation(a.dayGanElement, b.dayGanElement);
  switch (rel) {
    case 'generates':
    case 'generated':
      return 2;
    case 'same':
      return 1;
    case 'controls':
    case 'controlled':
      return -2;
    default: {
      const _exhaustive: never = rel;
      throw new Error(`예상 밖의 관계: ${_exhaustive}`);
    }
  }
}

// 동점이면 먼저 만난 쌍 유지 (결정적)
export function findPairs(members: MemberSaju[]): { best: PairResult; worst: PairResult } {
  let best: PairResult | null = null;
  let worst: PairResult | null = null;
  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      const score = pairScore(members[i], members[j]);
      const pair = { a: members[i].name, b: members[j].name, score };
      if (!best || score > best.score) best = pair;
      if (!worst || score < worst.score) worst = pair;
    }
  }
  if (!best || !worst) throw new Error('멤버는 2명 이상이어야 합니다');
  return { best, worst };
}
