export type ElementKey = 'wood' | 'fire' | 'earth' | 'metal' | 'water';

export const ELEMENT_KEYS: readonly ElementKey[] = ['wood', 'fire', 'earth', 'metal', 'water'];

export type Relation = 'generates' | 'generated' | 'controls' | 'controlled' | 'same';

export const ELEMENT_LABEL: Record<ElementKey, string> = {
  wood: '목(木)',
  fire: '화(火)',
  earth: '토(土)',
  metal: '금(金)',
  water: '수(水)',
};

export const ELEMENT_CHARACTER: Record<ElementKey, string> = {
  wood: '새싹이',
  fire: '불똥이',
  earth: '흙돌이',
  metal: '반짝이',
  water: '방울이',
};

export interface MemberInput {
  name: string;
  birthDate: string; // 'YYYY-MM-DD'
  birthHour: number | null; // 0~23, null = 시간 모름(시주 제외)
}

export type ElementDist = Record<ElementKey, number>; // 오행별 글자 수

export interface MemberSaju {
  name: string;
  dayGan: string; // 일간 한자, 예: '甲'
  dayGanElement: ElementKey;
  pillarGlyphs: string[]; // 간지 글자 배열 (6 또는 8글자)
  dist: ElementDist;
}

export interface PairResult {
  a: string;
  b: string;
  score: number;
}

export interface Iljin {
  ganZhi: string;
  elements: ElementKey[];
}

export interface TeamAnalysis {
  teamName: string;
  members: MemberSaju[];
  teamDist: ElementDist;
  teamPct: Record<ElementKey, number>; // 일진 가중 반영 후 백분율
  excess: ElementKey[]; // pct >= 35
  lacking: ElementKey[]; // pct <= 10
  iljin: Iljin;
  bestPair: PairResult;
  worstPair: PairResult;
}

export interface FoodItem {
  id: string;
  name: string;
  emoji: string;
  elements: ElementKey[]; // 최대 2개
}

export interface ScoredFood extends FoodItem {
  score: number;
}

export interface RecommendResult {
  top3: { id: string; name: string; emoji: string; comment: string }[];
  summary: string;
  teamFortune: string; // 오늘 일진 + 팀 오행 기반 한 줄 운세
  teamTopic: string; // 오행 기준 점심 대화 주제 + 럭키 요소
  source: 'llm' | 'fallback';
}

export function emptyDist(): ElementDist {
  return { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
}
