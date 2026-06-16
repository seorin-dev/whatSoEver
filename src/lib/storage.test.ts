import { describe, it, expect } from 'vitest';
import { saveTeam, loadTeams, deleteTeam } from './storage';

function memStorage(): Storage {
  const m = new Map<string, string>();
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => void m.set(k, v),
    removeItem: (k) => void m.delete(k),
    clear: () => m.clear(),
    key: () => null,
    get length() { return m.size; },
  } as Storage;
}

const team = {
  teamName: '개발1팀',
  members: [
    { name: '철수', birthDate: '1993-05-14', birthHour: 12 },
    { name: '영희', birthDate: '1996-11-02', birthHour: null },
  ],
};

describe('팀 저장', () => {
  it('저장 후 불러올 수 있다', () => {
    const s = memStorage();
    saveTeam(team, s);
    expect(loadTeams(s)).toEqual([team]);
  });
  it('같은 팀 이름은 덮어쓴다', () => {
    const s = memStorage();
    saveTeam(team, s);
    saveTeam({ ...team, members: team.members.slice(0, 2) }, s);
    expect(loadTeams(s)).toHaveLength(1);
  });
  it('깨진 데이터면 빈 배열', () => {
    const s = memStorage();
    s.setItem('lunchton.teams', '{{{');
    expect(loadTeams(s)).toEqual([]);
  });
  it('팀을 삭제하면 목록에서 빠지고 나머지를 반환한다', () => {
    const s = memStorage();
    saveTeam(team, s);
    saveTeam({ teamName: '다른팀', members: team.members }, s);
    const remaining = deleteTeam('다른팀', s);
    expect(remaining).toHaveLength(1);
    expect(remaining[0].teamName).toBe('개발1팀');
    expect(loadTeams(s)).toHaveLength(1);
  });
});
