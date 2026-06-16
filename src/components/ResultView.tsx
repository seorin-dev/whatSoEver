'use client';

import type { RecommendResult, TeamAnalysis } from '@/lib/saju/types';
import { ElementChart } from './ElementChart';
import { PairCard } from './PairCard';

interface Props {
  analysis: TeamAnalysis;
  reco: RecommendResult;
  onRedraw: () => void;
  onSave: () => void;
  onReset: () => void;
  saved: boolean;
  today: string; // 'YYYY년 M월 D일'
}

export function ResultView({ analysis, reco, onRedraw, onSave, onReset, saved, today }: Props) {
  const [first, ...rest] = reco.top3;
  if (!first) return null; // 폴백/LLM 모두 3개를 보장하지만 빈 배열 크래시 방어
  return (
    <div className="flex flex-col gap-4">
      <header className="text-center">
        <p className="text-xs tracking-widest text-ink-dim">
          {today} · {analysis.iljin.ganZhi}일
        </p>
        <p className="mt-3 text-sm font-bold text-accent">🥇 오늘의 추천</p>
        <div className="my-1 text-7xl leading-none">{first.emoji}</div>
        <h2 className="neon-text text-4xl font-extrabold">{first.name}</h2>
        <p className="mx-auto mt-3 max-w-sm text-sm text-ink-dim">{first.comment}</p>
        <p className="mx-auto mt-2 max-w-sm text-sm">{reco.summary}</p>
      </header>

      <div className="flex flex-col gap-2">
        {rest.map((f, i) => (
          <div key={f.id} className="glow-card flex items-center gap-3 p-3 text-left">
            <span className="text-3xl">{i === 0 ? '🥈' : '🥉'}</span>
            <span className="text-5xl leading-none">{f.emoji}</span>
            <div className="flex-1">
              <p className="text-lg font-bold">{f.name}</p>
              <p className="mt-0.5 text-xs text-ink-dim">{f.comment}</p>
            </div>
          </div>
        ))}
      </div>

      <ElementChart analysis={analysis} />
      <PairCard analysis={analysis} reco={reco} />

      <div className="flex gap-2">
        <button className="flex-1 rounded-xl bg-accent py-3 font-bold text-night" onClick={onRedraw}>
          다른 메뉴 추천 🎲
        </button>
        <button className="glow-card flex-1 py-3 font-bold" onClick={onSave} disabled={saved}>
          {saved ? '저장됨 ✅' : '팀 저장 💾'}
        </button>
      </div>
      <button className="py-1 text-center text-sm text-ink-dim" onClick={onReset}>
        ← 새 팀으로 다시 시작
      </button>
    </div>
  );
}
