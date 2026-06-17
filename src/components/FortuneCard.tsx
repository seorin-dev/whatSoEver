import type { RecommendResult, TeamAnalysis } from '@/lib/saju/types';

// 오늘의 팀 운세 + 팀 토픽 (오행 기준 점심 대화 주제 + 럭키 요소)
export function FortuneCard({ analysis, reco }: { analysis: TeamAnalysis; reco: RecommendResult }) {
  return (
    <div className="glow-card p-4">
      <p className="mb-3 text-xs uppercase tracking-widest text-ink-dim">
        오늘의 팀 운세 · {analysis.iljin.ganZhi}일
      </p>
      <div className="space-y-3 text-sm">
        <p className="flex gap-2">
          <span aria-hidden>🔮</span>
          <span className="flex-1">{reco.teamFortune}</span>
        </p>
        <p className="flex gap-2 border-t border-night-soft pt-3">
          <span aria-hidden>💬</span>
          <span className="flex-1">{reco.teamTopic}</span>
        </p>
      </div>
    </div>
  );
}
