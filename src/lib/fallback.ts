import type { ElementKey, RecommendResult, ScoredFood, TeamAnalysis } from './saju/types';
import { ELEMENT_LABEL, ELEMENT_CHARACTER } from './saju/types';
import { pick } from './seed';

// 과다 기운 총평 템플릿 (오행별 2개)
const EXCESS_SUMMARY: Record<ElementKey, string[]> = {
  fire: [
    '팀 전체에 불기운이 활활. 사소한 말에도 불붙기 좋은 날이니 시원한 메뉴로 진화 필수.',
    '불똥이가 너무 많아요! 오늘 회의 언성 주의보. 일단 시원한 걸로 식히고 시작합시다.',
  ],
  water: [
    '물기운이 넘실넘실. 다들 축 처지기 쉬운 날 — 따뜻하고 든든한 메뉴로 텐션을 끌어올리세요.',
    '방울이 과다 출현. 오늘따라 결정이 안 나는 팀이라면, 메뉴라도 화끈하게 정합시다.',
  ],
  wood: [
    '새싹이가 무성하게 자란 팀. 아이디어는 많은데 수습이 안 될 때는 든든한 한 끼가 답.',
    '목기운 과다 — 의욕이 넘쳐 점심을 거를 위험! 일단 먹고 합시다.',
  ],
  metal: [
    '반짝이 기운이 가득. 다들 칼같이 일하는 날이니 부드러운 메뉴로 긴장을 풀어주세요.',
    '금기운 과다 — 완벽주의 발동 중. 메뉴 고민은 사주에 맡기고 그냥 드세요.',
  ],
  earth: [
    '흙돌이처럼 든든...하다 못해 무거운 팀. 가볍고 산뜻한 메뉴로 환기가 필요해요.',
    '토기운 과다 — 안정 지향의 날. 늘 가던 그 집 말고 오늘은 새 메뉴에 도전!',
  ],
};

const BALANCED_SUMMARY = [
  '오행이 고르게 균형 잡힌 팀! 뭘 먹어도 좋은 날이지만, 굳이 고르자면 이거예요.',
  '균형의 팀. 오늘은 운명보다 취향이 이기는 날 — 그래도 사주는 이 메뉴를 밀어봅니다.',
];

// 음식의 첫 번째 오행 태그 기준 추천 코멘트
const FOOD_COMMENT: Record<ElementKey, string[]> = {
  water: ['끓어오른 팀 분위기를 한 방에 식혀줄 물기운 충전 메뉴.', '오늘 부족한 수기운을 국물째 들이켜세요.'],
  fire: ['처진 기운에 불을 붙여줄 화끈한 선택.', '오늘은 매운맛이 곧 회복약. 불기운 보충 완료.'],
  wood: ['신선한 목기운으로 막힌 아이디어를 뚫어주는 메뉴.', '초록초록한 생기 충전. 오후 회의가 달라집니다.'],
  metal: ['반짝이는 금기운으로 마무리 집중력을 올려주는 메뉴.', '바삭한 금기운 — 오후 디테일 작업에 특효.'],
  earth: ['속을 든든하게 받쳐주는 토기운 안정 메뉴.', '흔들리는 팀 분위기에 무게중심을 잡아줄 한 끼.'],
};

const BEST_PAIR_COMMENT = [
  '{a} ♥ {b} — 오늘 같이 앉으면 점심값이 굳는 환상 궁합.',
  '{a} ♥ {b} — 오늘만큼은 메뉴 취향도 통할 운명의 페어.',
];
const WORST_PAIR_COMMENT = [
  '{a} ⚡ {b} — 국물 튈 수 있음. 대각선 착석을 권장합니다.',
  '{a} ⚡ {b} — 오늘은 메뉴 얘기만. 깊은 대화는 내일로 미루세요.',
];

export function buildFallback(
  analysis: TeamAnalysis,
  candidates: ScoredFood[],
  seed: string,
): RecommendResult {
  const top3 = candidates.slice(0, 3).map((f, i) => ({
    id: f.id,
    name: f.name,
    emoji: f.emoji,
    comment: pick(FOOD_COMMENT[f.elements[0]], seed + f.id + i),
  }));

  const mainExcess = analysis.excess[0];
  const summaryPool = mainExcess ? EXCESS_SUMMARY[mainExcess] : BALANCED_SUMMARY;
  const lackNote = analysis.lacking.length
    ? ` (부족 기운: ${analysis.lacking.map((k) => ELEMENT_LABEL[k]).join(', ')} — ${ELEMENT_CHARACTER[analysis.lacking[0]]} 충전 필요)`
    : '';

  return {
    top3,
    summary: pick(summaryPool, seed + 'summary') + lackNote,
    pairComment: {
      best: pick(BEST_PAIR_COMMENT, seed + 'best')
        .replace('{a}', analysis.bestPair.a).replace('{b}', analysis.bestPair.b),
      worst: pick(WORST_PAIR_COMMENT, seed + 'worst')
        .replace('{a}', analysis.worstPair.a).replace('{b}', analysis.worstPair.b),
    },
    source: 'fallback',
  };
}
