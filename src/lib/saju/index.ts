import type { MemberInput, TeamAnalysis } from './types';
import { computeMemberSaju } from './pillars';
import { sumDists, toPct, judge } from './team';
import { findPairs } from './compat';
import { getIljin, applyIljin } from './iljin';

export function analyzeTeam(
  teamName: string,
  inputs: MemberInput[],
  date: Date,
): TeamAnalysis {
  if (inputs.length < 2 || inputs.length > 8) {
    throw new Error('멤버는 2~8명이어야 합니다');
  }
  const members = inputs.map(computeMemberSaju);
  const iljin = getIljin(date);
  const teamDist = sumDists(members.map((m) => m.dist));
  const weighted = applyIljin(teamDist, iljin);
  const teamPct = toPct(weighted);
  const { excess, lacking } = judge(teamPct);
  const { best, worst } = findPairs(members);
  return {
    teamName, members, teamDist, teamPct, excess, lacking, iljin,
    bestPair: best, worstPair: worst,
  };
}

export * from './types';
