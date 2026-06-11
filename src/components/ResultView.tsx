'use client';

import type { RecommendResult, TeamAnalysis } from '@/lib/saju/types';
import { ElementChart } from './ElementChart';
import { PairCard } from './PairCard';

interface Props {
  analysis: TeamAnalysis;
  reco: RecommendResult;
  onRedraw: () => void;
  onSave: () => void;
  saved: boolean;
  today: string; // 'YYYY년 M월 D일'
}

export function ResultView({ analysis, reco, onRedraw, onSave, saved, today }: Props) {
  const [first, ...rest] = reco.top3;
  if (!first) return null; // 폴백/LLM 모두 3개를 보장하지만 빈 배열 크래시 방어
  return (
    <div className="flex flex-col gap-4">
      <header className="text-center">
        <p className="text-xs tracking-widest text-ink-dim">
          {today} · {analysis.iljin.ganZhi}일
        </p>
        <h2 className="neon-text mt-2 text-3xl font-extrabold">
          오늘의 추천 {first.emoji} {first.name}
        </h2>
        <p className="mx-auto mt-3 max-w-sm text-sm text-ink-dim">{first.comment}</p>
        <p className="mx-auto mt-2 max-w-sm text-sm">{reco.summary}</p>
      </header>

      <div className="flex justify-center gap-2">
        {rest.map((f, i) => (
          <div key={f.id} className="glow-card px-3 py-2 text-center text-sm">
            <span className="text-xs text-ink-dim">{i === 0 ? '🥈' : '🥉'}</span>{' '}
            {f.emoji} {f.name}
            <p className="mt-0.5 max-w-40 text-xs text-ink-dim">{f.comment}</p>
          </div>
        ))}
      </div>

      <ElementChart analysis={analysis} />
      <PairCard analysis={analysis} reco={reco} />

      <div className="flex gap-2">
        <button className="flex-1 rounded-xl bg-accent py-3 font-bold text-night" onClick={onRedraw}>
          다시 뽑기 🎲
        </button>
        <button className="glow-card flex-1 py-3 font-bold" onClick={onSave} disabled={saved}>
          {saved ? '저장됨 ✅' : '팀 저장 💾'}
        </button>
      </div>
    </div>
  );
}
