import type { RecommendResult, ScoredFood, TeamAnalysis } from './saju/types';
import { buildFallback } from './fallback';

// fetch 실패(네트워크/5xx)면 클라이언트에서 직접 폴백 — 데모는 절대 죽지 않는다
export async function fetchRecommendation(
  analysis: TeamAnalysis,
  candidates: ScoredFood[],
  seed: string,
): Promise<RecommendResult> {
  try {
    const res = await fetch('/api/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ analysis, candidates, seed }),
    });
    if (!res.ok) throw new Error(`status ${res.status}`);
    return (await res.json()) as RecommendResult;
  } catch {
    return buildFallback(analysis, candidates, seed);
  }
}
