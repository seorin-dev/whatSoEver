import type { MemberInput } from './saju/types';

export interface SavedTeam {
  teamName: string;
  members: MemberInput[];
}

const KEY = 'lunchton.teams';

function defaultStorage(): Storage | null {
  return typeof window === 'undefined' ? null : window.localStorage;
}

export function loadTeams(storage: Storage | null = defaultStorage()): SavedTeam[] {
  if (!storage) return [];
  try {
    const raw = storage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveTeam(team: SavedTeam, storage: Storage | null = defaultStorage()): void {
  if (!storage) return;
  const teams = loadTeams(storage).filter((t) => t.teamName !== team.teamName);
  teams.unshift(team);
  storage.setItem(KEY, JSON.stringify(teams.slice(0, 10))); // 최대 10팀
}

export function deleteTeam(teamName: string, storage: Storage | null = defaultStorage()): SavedTeam[] {
  if (!storage) return [];
  const teams = loadTeams(storage).filter((t) => t.teamName !== teamName);
  storage.setItem(KEY, JSON.stringify(teams));
  return teams;
}
