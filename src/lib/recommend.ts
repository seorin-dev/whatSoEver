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
    `팀 오행 분포(오늘 일진 ${analysis.iljin.ganZhi} 반영): ${pct}`,
    `과다: ${analysis.excess.map((k) => ELEMENT_LABEL[k]).join(', ') || '없음'} / 부족: ${analysis.lacking.map((k) => ELEMENT_LABEL[k]).join(', ') || '없음'}`,
    `최고 궁합: ${analysis.bestPair.a} & ${analysis.bestPair.b} / 최악 궁합: ${analysis.worstPair.a} & ${analysis.worstPair.b}`,
    `메뉴 후보(점수순): ${candidates.map((c) => `${c.id}(${c.name})`).join(', ')}`,
    '',
    '위 후보 중 3개를 골라 순위를 매기고, 아래 JSON 형식(평탄 구조, 중첩 금지)으로만 응답하라.',
    '{"top3":[{"id":"<후보 id>","comment":"<메뉴별 추천 드립 1문장>"}],"summary":"<팀 총평 2문장, 밈 톤>","bestComment":"<최고 궁합 드립 1문장>","worstComment":"<최악 궁합 드립 1문장>"}',
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
    // 평탄 구조(bestComment/worstComment) 우선, 중첩(pairComment.best/worst)도 허용
    const best = typeof j.bestComment === 'string' ? j.bestComment : j.pairComment?.best;
    // worst는 선택값 — 2인 팀은 최고=최악 페어라 모델이 종종 생략하며, PairCard도 동일 페어면 worst를 숨긴다
    const worstRaw = typeof j.worstComment === 'string' ? j.worstComment : j.pairComment?.worst;
    if (typeof j.summary !== 'string' || typeof best !== 'string') return null;
    return {
      top3,
      summary: j.summary,
      pairComment: { best, worst: typeof worstRaw === 'string' ? worstRaw : '' },
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
    if (parsed) return { ...parsed, source: 'llm' };
  } catch {
    // 폴백으로 진행
  }
  return buildFallback(analysis, candidates, seed);
}
