import type { RecommendResult, ScoredFood, TeamAnalysis } from './saju/types';
import { ELEMENT_LABEL } from './saju/types';
import { buildFallback } from './fallback';

type Generate = (prompt: string) => Promise<string>;

export function buildPrompt(analysis: TeamAnalysis, candidates: ScoredFood[]): string {
  const pct = Object.entries(analysis.teamPct)
    .map(([k, v]) => `${ELEMENT_LABEL[k as keyof typeof ELEMENT_LABEL]} ${v}%`).join(', ');
  return [
    `팀 이름: ${analysis.teamName}`,
    `멤버: ${analysis.members.map((m) => m.name).join(', ')}`,
    `오늘 일진: ${analysis.iljin.ganZhi}`,
    `팀 오행 분포(오늘 일진 반영): ${pct}`,
    `과다: ${analysis.excess.map((k) => ELEMENT_LABEL[k]).join(', ') || '없음'} / 부족: ${analysis.lacking.map((k) => ELEMENT_LABEL[k]).join(', ') || '없음'}`,
    `메뉴 후보(점수순): ${candidates.map((c) => `${c.id}(${c.name})`).join(', ')}`,
    '',
    '위 후보 중 3개를 골라 순위를 매겨라. 각 메뉴의 comment는 반드시 팀의 과다/부족 오행과 연결해',
    '"왜 이 메뉴인지"를 사주 해석으로 풀어라(예: "불기운이 넘치니 시원하게 식혀줄 냉면!").',
    'teamFortune은 오늘 일진과 팀 오행 기반 한 줄 운세, teamTopic은 오행 기준 점심 대화 주제와 럭키 요소(컬러/자리 등)를 담아라.',
    '제약: 모든 문장은 위에 제시된 데이터(과다/부족 오행, 오늘 일진, 멤버, 메뉴)에만 근거하라.',
    '사주·오행·일진·메뉴와 무관한 일반론, 뜬금없는 인생 조언, 근거 없는 추측은 절대 넣지 마라.',
    '말투는 귀엽고 깜찍하게! 이모지와 애교 섞인 밈 톤으로 쓰되, 사주 맥락은 절대 잃지 마라.',
    '아래 JSON 형식(평탄 구조, 중첩 금지)으로만 응답하라.',
    '{"top3":[{"id":"<후보 id>","comment":"<오행 해석 담은 추천 1문장>"}],"summary":"<팀 총평 2문장, 밈 톤>","teamFortune":"<오늘 일진+팀 오행 기반 팀 운세 1문장>","teamTopic":"<오행 기준 점심 대화 주제 + 럭키 요소 1문장>"}',
  ].join('\n');
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error('timeout')), ms)),
  ]);
}

function parseLlm(raw: string, candidates: ScoredFood[]): Omit<RecommendResult, 'source'> | null {
  try {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const j = JSON.parse(cleaned);
    if (!Array.isArray(j.top3)) return null;
    // 나쁜 항목은 throw 대신 건너뛰고, id/name 둘 다로 매칭 — 모델 변형에 견고하게
    const top3: { id: string; name: string; emoji: string; comment: string }[] = [];
    const used = new Set<string>();
    for (const t of j.top3) {
      if (top3.length >= 3) break;
      const key = String(t?.id ?? t?.name ?? '');
      const food = candidates.find(
        (c) => !used.has(c.id) && (c.id === key || c.name === key || c.name === t?.name),
      );
      const comment = typeof t?.comment === 'string' ? t.comment.slice(0, 300) : '';
      if (!food || !comment) continue;
      used.add(food.id);
      top3.push({ id: food.id, name: food.name, emoji: food.emoji, comment });
    }
    if (top3.length < 3) return null;
    if (typeof j.summary !== 'string') return null;
    // teamFortune/teamTopic은 선택값 — 누락 시 buildRecommendation이 폴백 값으로 보강한다
    return {
      top3,
      summary: j.summary,
      teamFortune: typeof j.teamFortune === 'string' ? j.teamFortune : '',
      teamTopic: typeof j.teamTopic === 'string' ? j.teamTopic : '',
    };
  } catch {
    return null;
  }
}

export async function buildRecommendation(
  analysis: TeamAnalysis,
  candidates: ScoredFood[],
  generate: Generate,
  seed: string,
  timeoutMs = 8000,
): Promise<RecommendResult> {
  try {
    const raw = await withTimeout(generate(buildPrompt(analysis, candidates)), timeoutMs);
    const parsed = parseLlm(raw, candidates);
    if (parsed) {
      // 운세/토픽을 모델이 생략하면 결정적 폴백 텍스트로 보강 — 빈 카드 방지
      const fb = buildFallback(analysis, candidates, seed);
      return {
        ...parsed,
        teamFortune: parsed.teamFortune || fb.teamFortune,
        teamTopic: parsed.teamTopic || fb.teamTopic,
        source: 'llm',
      };
    }
  } catch {
    // 폴백으로 진행
  }
  return buildFallback(analysis, candidates, seed);
}
