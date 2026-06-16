'use client';

import { useState, useEffect, useRef } from 'react';
import type { MemberInput } from '@/lib/saju/types';
import { ELEMENT_KEYS } from '@/lib/saju/types';
import { loadTeams, deleteTeam, type SavedTeam } from '@/lib/storage';
import { ElementCharacter } from './ElementCharacter';

interface Props { onSubmit: (teamName: string, members: MemberInput[]) => void; }

const EMPTY: MemberInput = { name: '', birthDate: '', birthHour: null };

function pad2(s: string): string {
  return s.padStart(2, '0');
}

// 연/월/일 분리 입력 + 자동 이동 — 네이티브 날짜 피커의 연도 스크롤 불편 해소
function DateField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const init = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const [y, setY] = useState(init ? init[1] : '');
  const [m, setM] = useState(init ? String(Number(init[2])) : '');
  const [d, setD] = useState(init ? String(Number(init[3])) : '');
  const monthRef = useRef<HTMLInputElement>(null);
  const dayRef = useRef<HTMLInputElement>(null);

  function emit(ny: string, nm: string, nd: string) {
    onChange(ny.length === 4 && nm && nd ? `${ny}-${pad2(nm)}-${pad2(nd)}` : '');
  }
  function onY(v: string) {
    const x = v.replace(/\D/g, '').slice(0, 4);
    setY(x);
    emit(x, m, d);
    if (x.length === 4) monthRef.current?.focus();
  }
  function onM(v: string) {
    let x = v.replace(/\D/g, '').slice(0, 2);
    if (Number(x) > 12) x = '12';
    setM(x);
    emit(y, x, d);
    if (x.length === 2 || Number(x) > 1) dayRef.current?.focus(); // 2~9월은 한 자리로 완성 → 바로 이동
  }
  function onD(v: string) {
    let x = v.replace(/\D/g, '').slice(0, 2);
    if (Number(x) > 31) x = '31';
    setD(x);
    emit(y, m, x);
  }
  const cls = 'rounded-lg bg-night-soft px-2 py-2 text-center';
  return (
    <div className="flex flex-1 items-center gap-1">
      <input inputMode="numeric" className={`${cls} w-[4.2rem]`} placeholder="1993"
        value={y} onChange={(e) => onY(e.target.value)} aria-label="출생 연도" />
      <span className="text-ink-dim">.</span>
      <input ref={monthRef} inputMode="numeric" className={`${cls} w-11`} placeholder="월"
        value={m} onChange={(e) => onM(e.target.value)} aria-label="출생 월" />
      <span className="text-ink-dim">.</span>
      <input ref={dayRef} inputMode="numeric" className={`${cls} w-11`} placeholder="일"
        value={d} onChange={(e) => onD(e.target.value)} aria-label="출생 일" />
    </div>
  );
}

function validate(teamName: string, members: MemberInput[]): string | null {
  if (!teamName.trim()) return '팀 이름을 입력해주세요';
  if (members.length < 2) return '멤버는 2명 이상이어야 해요';
  for (const m of members) {
    if (!m.name.trim()) return '이름이 비어있는 멤버가 있어요';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(m.birthDate)) return `${m.name || '멤버'}의 생년월일을 확인해주세요`;
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
  const [loadKey, setLoadKey] = useState(0); // 저장 팀 불러올 때 멤버 카드 리마운트 → DateField 재초기화

  useEffect(() => { setSaved(loadTeams()); }, []);

  function updateMember(i: number, patch: Partial<MemberInput>) {
    setMembers((prev) => prev.map((m, j) => (j === i ? { ...m, ...patch } : m)));
  }

  function loadSavedTeam(t: SavedTeam) {
    setTeamName(t.teamName);
    setMembers(t.members.map((m) => ({ ...m })));
    setLoadKey((k) => k + 1);
    setError(null);
  }

  function handleDelete(name: string) {
    setSaved(deleteTeam(name));
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
        <h1 className="neon-text mt-3 text-3xl font-extrabold">🍚 런치포어스</h1>
        <p className="mt-1 text-sm text-ink-dim">오늘 우리 팀 점심, 사주에게 물어봐</p>
      </header>

      {saved.length > 0 && (
        <div className="glow-card p-3">
          <p className="mb-2 text-xs text-ink-dim">저장된 팀 불러오기</p>
          <div className="flex flex-wrap gap-2">
            {saved.map((t) => (
              <span key={t.teamName}
                className="flex items-center gap-1 rounded-full border border-accent/40 pl-3 pr-1 py-1 text-sm">
                <button onClick={() => loadSavedTeam(t)}>
                  {t.teamName} ({t.members.length}명)
                </button>
                <button onClick={() => handleDelete(t.teamName)} aria-label={`${t.teamName} 삭제`}
                  className="flex h-5 w-5 items-center justify-center rounded-full text-ink-dim hover:bg-night-soft hover:text-el-fire">
                  ✕
                </button>
              </span>
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
        <div key={`${loadKey}-${i}`} className="glow-card flex flex-col gap-2 p-3">
          <div className="flex items-center gap-2">
            <input
              className="flex-1 rounded-lg bg-night-soft px-3 py-2"
              placeholder={`멤버 ${i + 1} 이름`}
              value={m.name}
              onChange={(e) => updateMember(i, { name: e.target.value })}
            />
            {members.length > 2 && (
              <button className="px-1 text-ink-dim hover:text-el-fire" aria-label="멤버 삭제"
                onClick={() => setMembers((prev) => prev.filter((_, j) => j !== i))}>✕</button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <DateField value={m.birthDate} onChange={(v) => updateMember(i, { birthDate: v })} />
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
      <p className="text-center text-xs text-ink-dim">태어난 시간은 몰라도 OK · 연도는 직접 입력</p>
    </div>
  );
}
