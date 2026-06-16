'use client';

import { useEffect, useRef, useState } from 'react';
import type { ScoredFood, ElementKey } from '@/lib/saju/types';
import { ELEMENT_CHARACTER, ELEMENT_LABEL, ELEMENT_KEYS } from '@/lib/saju/types';
import { ElementCharacter } from './ElementCharacter';

const ORBIT_RADIUS = 178; // 룰렛(288px, 반지름 144) 바깥을 도는 궤도 반지름
const ORBIT_PERIOD = '18s';

const SEGMENT_COLORS: Record<ElementKey, string> = {
  wood: '#2e6b4a', fire: '#7a2e3e', earth: '#6b542e', metal: '#4a5570', water: '#2e4a7a',
};

interface Props {
  items: ScoredFood[];          // 8개
  winnerIndex: number | null;   // API 응답 도착 시 설정
  spinMessages: string[];       // 오행 멘트 (계산 결과 기반)
  onDone: () => void;
}

export function Roulette({ items, winnerIndex, spinMessages, onDone }: Props) {
  const [deg, setDeg] = useState(0);
  const [stopping, setStopping] = useState(false);
  const [msgIdx, setMsgIdx] = useState(0);
  const rafRef = useRef(0);
  const degRef = useRef(0);
  const seg = 360 / items.length;

  // 무한 회전 (winner 도착 전)
  useEffect(() => {
    if (stopping) return;
    const tick = () => {
      degRef.current = (degRef.current + 6) % 360000;
      setDeg(degRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [stopping]);

  // 멘트 로테이션 (정지 후에는 멈춤)
  useEffect(() => {
    if (stopping) return;
    const t = setInterval(() => setMsgIdx((i) => (i + 1) % spinMessages.length), 1500);
    return () => clearInterval(t);
  }, [spinMessages.length, stopping]);

  // winner 도착 → 감속 정지 (최소 1.5초는 돌고 나서)
  useEffect(() => {
    if (winnerIndex === null) return;
    const minSpin = setTimeout(() => {
      cancelAnimationFrame(rafRef.current);
      // 포인터(상단 0도)에 winner 칸 중심이 오도록: 현재 각도에서 +2바퀴 이상 더 회전
      const targetMod = (360 - (winnerIndex * seg + seg / 2)) % 360;
      const current = degRef.current % 360;
      const delta = ((targetMod - current) % 360 + 360) % 360 + 720;
      setStopping(true);
      degRef.current += delta; // 정지 후 재스핀 등에서 stale 값을 읽지 않도록 동기화
      setDeg(degRef.current);
    }, 1500);
    return () => clearTimeout(minSpin);
  }, [winnerIndex, seg]);

  const gradient = items
    .map((f, i) => `${SEGMENT_COLORS[f.elements[0]]} ${i * seg}deg ${(i + 1) * seg}deg`)
    .join(', ');

  return (
    <div className="flex flex-col items-center gap-8 py-6">
      <div className="relative flex items-center justify-center" style={{ width: 400, height: 400 }}>
        {/* 룰렛 주변을 도는 오행 캐릭터 5종 */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ animation: `lf-orbit ${ORBIT_PERIOD} linear infinite` }}
        >
          {ELEMENT_KEYS.map((el, i) => {
            const a = (360 / ELEMENT_KEYS.length) * i;
            return (
              <div
                key={el}
                className="absolute left-1/2 top-1/2"
                style={{
                  transform: `rotate(${a}deg) translateY(-${ORBIT_RADIUS}px) rotate(${-a}deg) translate(-50%, -50%)`,
                }}
              >
                {/* 궤도 회전을 역으로 상쇄해 캐릭터는 항상 똑바로 */}
                <div style={{ animation: `lf-orbit-rev ${ORBIT_PERIOD} linear infinite` }}>
                  <ElementCharacter element={el} size={52} />
                </div>
              </div>
            );
          })}
        </div>
        <div className="absolute left-1/2 top-[42px] z-20 -translate-x-1/2 text-2xl drop-shadow">🔻</div>
        <div
          className="relative h-72 w-72 rounded-full border-4 border-accent/60"
          style={{
            background: `conic-gradient(${gradient})`,
            transform: `rotate(${deg}deg)`,
            transition: stopping ? 'transform 2.5s cubic-bezier(0.15, 0.85, 0.25, 1)' : 'none',
            boxShadow: '0 0 40px rgba(120,100,255,0.35)',
          }}
          onTransitionEnd={onDone}
        >
          {items.map((f, i) => {
            const angle = i * seg + seg / 2;
            return (
              <div key={f.id}
                className="absolute left-1/2 top-1/2 text-center text-[11px] font-bold"
                style={{
                  transform: `rotate(${angle}deg) translateY(-108px) rotate(0deg)`,
                  transformOrigin: '0 0',
                }}>
                <div className="text-xl">{f.emoji}</div>
                <div className="-ml-6 w-12">{f.name}</div>
              </div>
            );
          })}
        </div>
      </div>
      <p className="neon-text min-h-6 text-center text-sm text-ink-dim">
        {spinMessages[msgIdx] ?? '팀의 기운을 읽는 중...'}
      </p>
    </div>
  );
}

export function buildSpinMessages(excess: ElementKey[], lacking: ElementKey[]): string[] {
  const msgs = ['팀의 기운을 읽는 중...', '오늘의 일진을 확인하는 중...'];
  for (const e of excess) msgs.push(`${ELEMENT_LABEL[e]} 기운이 심상치 않습니다... ${ELEMENT_CHARACTER[e]} 과다 감지!`);
  for (const l of lacking) msgs.push(`${ELEMENT_CHARACTER[l]}이(가) 부족해요... ${ELEMENT_LABEL[l]} 충전이 필요합니다`);
  return msgs;
}
