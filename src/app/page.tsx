'use client';

import { useState } from 'react';
import type { MemberInput, RecommendResult, ScoredFood, TeamAnalysis } from '@/lib/saju/types';
import { analyzeTeam } from '@/lib/saju';
import { FOODS } from '@/lib/foods';
import { scoreFoods } from '@/lib/scoring';
import { fetchRecommendation } from '@/lib/recommend-client';
import { saveTeam } from '@/lib/storage';
import { TeamForm } from '@/components/TeamForm';
import { Roulette, buildSpinMessages } from '@/components/Roulette';
import { ResultView } from '@/components/ResultView';

type Phase = 'input' | 'spin' | 'result';

export default function Home() {
  const [phase, setPhase] = useState<Phase>('input');
  const [analysis, setAnalysis] = useState<TeamAnalysis | null>(null);
  const [candidates, setCandidates] = useState<ScoredFood[]>([]);
  const [reco, setReco] = useState<RecommendResult | null>(null);
  const [winnerIndex, setWinnerIndex] = useState<number | null>(null);
  const [members, setMembers] = useState<MemberInput[]>([]);
  const [saved, setSaved] = useState(false);
  const [excludeIds, setExcludeIds] = useState<string[]>([]);

  const today = new Date();
  const todayLabel = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;

  async function run(teamName: string, memberInputs: MemberInput[], exclude: string[]) {
    const a = analyzeTeam(teamName, memberInputs, today);
    const seed = `${teamName}|${today.toDateString()}|${exclude.length}`;
    const cands = scoreFoods(a, FOODS, seed, exclude).slice(0, 8);
    setAnalysis(a);
    setCandidates(cands);
    setMembers(memberInputs);
    setWinnerIndex(null);
    setReco(null);
    setSaved(false);
    setPhase('spin');

    const r = await fetchRecommendation(a, cands, seed);
    setReco(r);
    const idx = cands.findIndex((c) => c.id === r.top3[0].id);
    setWinnerIndex(idx >= 0 ? idx : 0);
  }

  function handleRedraw() {
    if (!analysis || !reco) return;
    const newExclude = [...excludeIds, ...reco.top3.map((t) => t.id)];
    setExcludeIds(newExclude);
    run(analysis.teamName, members, newExclude);
  }

  function handleSave() {
    if (!analysis) return;
    saveTeam({ teamName: analysis.teamName, members });
    setSaved(true);
  }

  return (
    <>
      {phase === 'input' && (
        <TeamForm onSubmit={(name, m) => { setExcludeIds([]); run(name, m, []); }} />
      )}
      {phase === 'spin' && analysis && (
        <Roulette
          items={candidates}
          winnerIndex={winnerIndex}
          spinMessages={buildSpinMessages(analysis.excess, analysis.lacking)}
          onDone={() => setPhase('result')}
        />
      )}
      {phase === 'result' && analysis && reco && (
        <ResultView
          analysis={analysis} reco={reco} today={todayLabel}
          onRedraw={handleRedraw} onSave={handleSave} saved={saved}
        />
      )}
    </>
  );
}
