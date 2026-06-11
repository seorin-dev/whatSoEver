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
    '위 후보 중 3개를 골라 순위를 매기고, 아래 JSON 형식으로만 응답하라.',
    '{"top3":[{"id":"<후보 id>","comment":"<메뉴별 추천 드립 1문장>"}],"summary":"<팀 총평 2문장, 밈 톤>","pairComment":{"best":"<최고 궁합 드립 1문장>","worst":"<최악 궁합 드립 1문장>"}}',
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
    if (!Array.isArray(j.top3) || j.top3.length < 3) return null;
    const top3 = j.top3.slice(0, 3).map((t: { id: string; comment: string }) => {
      const food = candidates.find((c) => c.id === t.id);
      if (!food || typeof t.comment !== 'string') throw new Error('invalid id');
      return { id: food.id, name: food.name, emoji: food.emoji, comment: t.comment };
    });
    if (typeof j.summary !== 'string' || !j.pairComment?.best || !j.pairComment?.worst) return null;
    return { top3, summary: j.summary, pairComment: j.pairComment };
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
