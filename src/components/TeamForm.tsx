'use client';

import { useState, useEffect } from 'react';
import type { MemberInput } from '@/lib/saju/types';
import { ELEMENT_KEYS } from '@/lib/saju/types';
import { loadTeams, type SavedTeam } from '@/lib/storage';
import { ElementCharacter } from './ElementCharacter';

interface Props { onSubmit: (teamName: string, members: MemberInput[]) => void; }

const EMPTY: MemberInput = { name: '', birthDate: '', birthHour: null };

function validate(teamName: string, members: MemberInput[]): string | null {
  if (!teamName.trim()) return '팀 이름을 입력해주세요';
  if (members.length < 2) return '멤버는 2명 이상이어야 해요';
  for (const m of members) {
    if (!m.name.trim()) return '이름이 비어있는 멤버가 있어요';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(m.birthDate)) return `${m.name}의 생년월일을 확인해주세요`;
    const d = new Date(m.birthDate);
    if (d < new Date('1900-01-01') || d > new Date()) return `${m.name}의 생년월일 범위가 이상해요`;
  }
  return null;
}

export function TeamForm({ onSubmit }: Props) {
  const [teamName, setTeamName] = useState('');
  const [members, setMembers] = useState<MemberInput[]>([{ ...EMPTY }, { ...EMPTY }]);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<SavedTeam[]>([]);

  useEffect(() => { setSaved(loadTeams()); }, []);

  function updateMember(i: number, patch: Partial<MemberInput>) {
    setMembers((prev) => prev.map((m, j) => (j === i ? { ...m, ...patch } : m)));
  }

  function handleSubmit() {
    const err = validate(teamName, members);
    if (err) { setError(err); return; }
    onSubmit(teamName.trim(), members);
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="text-center">
        <div className="flex justify-center gap-1">
          {ELEMENT_KEYS.map((el) => <ElementCharacter key={el} element={el} size={44} />)}
        </div>
        <h1 className="neon-text mt-3 text-3xl font-extrabold">🍚 점심팔자</h1>
        <p className="mt-1 text-sm text-ink-dim">오늘 우리 팀 점심, 사주에게 물어봐</p>
      </header>

      {saved.length > 0 && (
        <div className="glow-card p-3">
          <p className="mb-2 text-xs text-ink-dim">저장된 팀 불러오기</p>
          <div className="flex flex-wrap gap-2">
            {saved.map((t) => (
              <button key={t.teamName}
                className="rounded-full border border-accent/40 px-3 py-1 text-sm"
                onClick={() => { setTeamName(t.teamName); setMembers(t.members); }}>
                {t.teamName} ({t.members.length}명)
              </button>
            ))}
          </div>
        </div>
      )}

      <input
        className="glow-card w-full px-4 py-3"
        placeholder="팀 이름 (예: 개발1팀 점심원정대)"
        value={teamName}
        onChange={(e) => setTeamName(e.target.value)}
      />

      {members.map((m, i) => (
        <div key={i} className="glow-card flex flex-col gap-2 p-3">
          <div className="flex items-center gap-2">
            <input
              className="flex-1 rounded-lg bg-night-soft px-3 py-2"
              placeholder={`멤버 ${i + 1} 이름`}
              value={m.name}
              onChange={(e) => updateMember(i, { name: e.target.value })}
            />
            {members.length > 2 && (
              <button className="text-ink-dim" aria-label="멤버 삭제"
                onClick={() => setMembers((prev) => prev.filter((_, j) => j !== i))}>✕</button>
            )}
          </div>
          <div className="flex gap-2">
            <input type="date" className="flex-1 rounded-lg bg-night-soft px-3 py-2"
              value={m.birthDate}
              onChange={(e) => updateMember(i, { birthDate: e.target.value })} />
            <select className="rounded-lg bg-night-soft px-2 py-2"
              value={m.birthHour ?? ''}
              onChange={(e) => updateMember(i, {
                birthHour: e.target.value === '' ? null : Number(e.target.value),
              })}>
              <option value="">시간 모름</option>
              {Array.from({ length: 24 }, (_, h) => (
                <option key={h} value={h}>{h}시</option>
              ))}
            </select>
          </div>
        </div>
      ))}

      {members.length < 8 && (
        <button className="glow-card py-2 text-ink-dim"
          onClick={() => setMembers((prev) => [...prev, { ...EMPTY }])}>
          ＋ 멤버 추가
        </button>
      )}

      {error && <p className="text-center text-sm text-el-fire">{error}</p>}

      <button
        className="rounded-xl bg-accent py-4 text-lg font-bold text-night neon-text"
        onClick={handleSubmit}>
        오늘의 점심 운세 보기 🔮
      </button>
      <p className="text-center text-xs text-ink-dim">태어난 시간은 몰라도 OK</p>
    </div>
  );
}
