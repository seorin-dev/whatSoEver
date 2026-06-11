import type { RecommendResult, TeamAnalysis } from '@/lib/saju/types';

export function PairCard({ analysis, reco }: { analysis: TeamAnalysis; reco: RecommendResult }) {
  // 2인 팀이면 유일한 페어가 최고/최악 둘 다가 되므로 최고 궁합만 보여준다
  const samePair =
    analysis.bestPair.a === analysis.worstPair.a && analysis.bestPair.b === analysis.worstPair.b;
  return (
    <div className="glow-card p-4">
      <p className="mb-2 text-xs uppercase tracking-widest text-ink-dim">오늘의 궁합 페어</p>
      <div className="space-y-2 text-sm">
        <p>
          💕 <b>{analysis.bestPair.a} ♥ {analysis.bestPair.b}</b>
          <span className="block text-xs text-ink-dim">{reco.pairComment.best}</span>
        </p>
        {!samePair && (
          <p>
            ⚡ <b>{analysis.worstPair.a} ↔ {analysis.worstPair.b}</b>
            <span className="block text-xs text-ink-dim">{reco.pairComment.worst}</span>
          </p>
        )}
      </div>
    </div>
  );
}
