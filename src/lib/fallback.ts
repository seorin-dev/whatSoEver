import type { ElementKey, RecommendResult, ScoredFood, TeamAnalysis } from './saju/types';
import { ELEMENT_LABEL, ELEMENT_CHARACTER } from './saju/types';
import { relation } from './saju/elements';
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

// (3) 추천문구 워싱 — 팀의 과다 기운을 음식 오행이 극(剋)해서 다스리는 경우
// {food} = 메뉴 이름, {ex} = 과다 기운 라벨
const EXCESS_TAME: Record<ElementKey, string[]> = {
  fire: [
    '팀에 {ex} 기운이 활활 타오르는 날 — {food}(으)로 시원하게 식혀 균형을 잡아요. 오늘은 쿨하게!',
    '들끓는 {ex} 기운, {food} 한 그릇이면 진정. 오후 회의 온도가 내려갑니다.',
  ],
  water: [
    '{ex} 기운이 무겁게 가라앉은 팀 — {food}(으)로 데워 흐름을 끌어올려요.',
    '축 처지게 하는 {ex} 기운, 뜨끈한 {food}(으)로 텐션 복구 완료.',
  ],
  wood: [
    '{ex} 기운이 단단히 뭉친 날 — {food}(으)로 부드럽게 풀어 숨통을 틔워요.',
    '꽉 막힌 {ex} 기운, {food}(으)로 환기하면 오후가 가벼워집니다.',
  ],
  metal: [
    '{ex} 기운이 흐트러진 팀 — {food}(으)로 또렷하게 다잡아 집중력을 세워요.',
    '느슨해진 {ex} 기운, {food}(으)로 칼같이 정돈하고 오후 마무리 가즈아.',
  ],
  earth: [
    '{ex} 기운이 출렁이는 날 — {food}(으)로 묵직하게 눌러 중심을 잡아요.',
    '들뜬 {ex} 기운, 든든한 {food}(으)로 무게중심 회복.',
  ],
};

// (3) 음식 오행이 팀의 부족 기운을 직접 채워주는 경우
// {food} = 메뉴 이름, {el} = 부족 기운 라벨
const LACK_FILL: Record<ElementKey, string[]> = {
  water: ['오늘 팀에 부족한 {el} 기운 — {food} 국물째 들이켜 충전하세요.', '메마른 {el} 기운, {food}(으)로 촉촉하게 보충 완료.'],
  fire: ['오늘 팀에 부족한 {el} 기운 — {food}(으)로 화끈하게 불을 지펴요.', '식어버린 {el} 기운, 매콤한 {food}(이)가 곧 회복약.'],
  wood: ['오늘 팀에 부족한 {el} 기운 — {food}(으)로 초록초록 생기를 채워요.', '비어버린 {el} 기운, 신선한 {food}(으)로 아이디어 시동.'],
  metal: ['오늘 팀에 부족한 {el} 기운 — {food}(으)로 반짝이는 집중력을 더해요.', '모자란 {el} 기운, 바삭한 {food}(으)로 디테일 충전.'],
  earth: ['오늘 팀에 부족한 {el} 기운 — {food}(으)로 든든하게 속을 받쳐요.', '흔들리는 {el} 기운, {food}(으)로 무게중심 보강.'],
};

// (3) 기본 — 음식 자체 오행 기운 설명 (과다/부족 매칭이 없을 때)
const FOOD_BASE: Record<ElementKey, string[]> = {
  water: ['{food}의 수(水)기운이 팀 분위기를 시원하게 정돈해줘요.', '맑은 수기운이 도는 {food} — 오늘 팀 흐름과 잘 맞습니다.'],
  fire: ['{food}의 화(火)기운이 팀에 활력을 더해줘요.', '화끈한 화기운의 {food} — 오후 시동에 제격.'],
  wood: ['{food}의 목(木)기운이 팀에 생기를 불어넣어요.', '싱그러운 목기운의 {food} — 막힌 아이디어를 틔웁니다.'],
  metal: ['{food}의 금(金)기운이 팀의 집중력을 올려줘요.', '단단한 금기운의 {food} — 오후 마무리에 딱.'],
  earth: ['{food}의 토(土)기운이 팀에 안정감을 더해줘요.', '든든한 토기운의 {food} — 흔들림 없는 오후를 만듭니다.'],
};

// (4) 팀 운세 — 오늘 일진 + 과다 기운 기반 한 줄. {ganZhi} = 오늘 일진 간지
const FORTUNE_EXCESS: Record<ElementKey, string[]> = {
  fire: ['{ganZhi}일 기운이 팀의 불기운을 더 키웁니다 — 욱하기 전에 한 박자 쉬면 운이 트여요.', '{ganZhi}일, 팀 화기운이 정점. 말보다 행동이 통하는 날입니다.'],
  water: ['{ganZhi}일 기운이 팀의 물기운을 더합니다 — 결정은 미루지 말고 오전에 끝내세요.', '{ganZhi}일, 팀 수기운이 깊어지는 날. 차분히 가면 막힌 일이 풀립니다.'],
  wood: ['{ganZhi}일 기운이 팀의 목기운을 북돋웁니다 — 아이디어를 펼치기 좋은 날, 단 마무리에 집중.', '{ganZhi}일, 팀 목기운이 무성. 일을 벌이기 전에 우선순위부터 정하세요.'],
  metal: ['{ganZhi}일 기운이 팀의 금기운을 세웁니다 — 디테일이 빛나는 날, 완벽주의는 점심까지만.', '{ganZhi}일, 팀 금기운이 날카로운 날. 결단은 빠르게, 말은 부드럽게.'],
  earth: ['{ganZhi}일 기운이 팀의 토기운을 더합니다 — 안정감 만점이지만 변화 한 스푼이 행운.', '{ganZhi}일, 팀 토기운이 단단한 날. 미뤄둔 일을 처리하면 운이 따릅니다.'],
};
const FORTUNE_BALANCED = [
  '{ganZhi}일, 오행이 고르게 흐르는 균형의 날 — 무엇을 해도 무난하게 풀립니다.',
  '{ganZhi}일, 팀 기운이 평온한 날. 평소 미뤄둔 대화를 나누기 좋아요.',
];

// (4) 팀 토픽 — 점심 대화 주제 + 오행 럭키 요소. 과다 기운을 다스리는 방향으로 구성
const TOPIC_EXCESS: Record<ElementKey, string[]> = {
  fire: ['🔥 점심 토픽 "요즘 가장 열올린 일" — 단 목소리는 차분히. 럭키 컬러는 시원한 블루.', '🔥 토픽 "최근 식혀야 할 고민" 한 가지씩. 오늘의 행운 자리는 창가, 럭키 컬러 블루.'],
  water: ['💧 점심 토픽 "이번 주 작은 성취" — 텐션 끌어올리기. 럭키 컬러는 따뜻한 레드.', '💧 토픽 "오늘 하고 싶은 도전" 공유. 오늘의 행운 자리는 햇살 드는 쪽, 럭키 컬러 레드.'],
  wood: ['🌱 점심 토픽 "지금 정리하고 싶은 일" — 한 가지로 좁히기. 럭키 컬러는 차분한 화이트.', '🌱 토픽 "올해 마무리할 목표" 점검. 오늘의 행운 아이템은 메모지, 럭키 컬러 화이트.'],
  metal: ['✨ 점심 토픽 "최근 마음이 풀어진 순간" — 긴장 풀기. 럭키 컬러는 포근한 베이지.', '✨ 토픽 "요즘 챙기는 소소한 휴식" 나누기. 오늘의 행운 컬러는 어스 톤 베이지.'],
  earth: ['⛰️ 점심 토픽 "도전해보고 싶은 새로움" — 환기하기. 럭키 컬러는 싱그러운 그린.', '⛰️ 토픽 "최근 바꿔본 작은 습관" 공유. 오늘의 행운 아이템은 식물, 럭키 컬러 그린.'],
};
const TOPIC_BALANCED = [
  '🍀 점심 토픽 "요즘 빠진 취미" 가볍게 공유. 오늘은 어떤 자리에 앉아도 좋은 균형의 날!',
  '🍀 점심 토픽 "이번 주 베스트 순간" 한 줄씩. 오늘의 럭키 요소는 함께 웃는 타이밍.',
];

function fillTokens(s: string, tokens: Record<string, string>): string {
  // replacer 함수 사용 — 값에 '$'가 있어도 특수 치환 패턴($&, $' 등)으로 깨지지 않게
  return Object.entries(tokens).reduce(
    (acc, [k, v]) => acc.replace(`{${k}}`, () => v),
    s,
  );
}

// (3) 음식 추천 코멘트를 팀의 과다/부족 오행과 연결해 "왜 이 메뉴인지" 해석으로 생성
function foodComment(food: ScoredFood, analysis: TeamAnalysis, seed: string): string {
  const foodEl = food.elements[0];
  const excess = analysis.excess[0];
  const lack = analysis.lacking[0];
  const key = seed + food.id;

  // 1순위: 음식 오행이 팀 부족 기운을 직접 채우는 경우
  if (lack && food.elements.includes(lack)) {
    return fillTokens(pick(LACK_FILL[lack], key), { food: food.name, el: ELEMENT_LABEL[lack] });
  }
  // 2순위: 음식 오행이 팀 과다 기운을 극(剋)해 다스리는 경우
  if (excess && relation(foodEl, excess) === 'controls') {
    return fillTokens(pick(EXCESS_TAME[excess], key), { food: food.name, ex: ELEMENT_LABEL[excess] });
  }
  // 기본: 음식 자체 오행 설명
  return fillTokens(pick(FOOD_BASE[foodEl], key), { food: food.name });
}

export function buildFallback(
  analysis: TeamAnalysis,
  candidates: ScoredFood[],
  seed: string,
): RecommendResult {
  const top3 = candidates.slice(0, 3).map((f, i) => ({
    id: f.id,
    name: f.name,
    emoji: f.emoji,
    comment: foodComment(f, analysis, seed + i),
  }));

  const mainExcess = analysis.excess[0];
  const summaryPool = mainExcess ? EXCESS_SUMMARY[mainExcess] : BALANCED_SUMMARY;
  const lackNote = analysis.lacking.length
    ? ` (부족 기운: ${analysis.lacking.map((k) => ELEMENT_LABEL[k]).join(', ')} — ${ELEMENT_CHARACTER[analysis.lacking[0]]} 충전 필요)`
    : '';

  const ganZhi = analysis.iljin.ganZhi;
  const teamFortune = fillTokens(
    pick(mainExcess ? FORTUNE_EXCESS[mainExcess] : FORTUNE_BALANCED, seed + 'fortune'),
    { ganZhi },
  );
  const teamTopic = pick(mainExcess ? TOPIC_EXCESS[mainExcess] : TOPIC_BALANCED, seed + 'topic');

  return {
    top3,
    summary: pick(summaryPool, seed + 'summary') + lackNote,
    teamFortune,
    teamTopic,
    source: 'fallback',
  };
}
