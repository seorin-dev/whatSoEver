import type { ElementKey } from '@/lib/saju/types';

const PALETTE: Record<ElementKey, { main: string; dark: string; glow: string }> = {
  fire:  { main: '#ffd34d', dark: '#e8356e', glow: 'rgba(255,120,60,0.55)' },
  water: { main: '#d8f4ff', dark: '#1c63d6', glow: 'rgba(80,170,255,0.5)' },
  wood:  { main: '#d2ff9e', dark: '#2e8f4e', glow: 'rgba(110,210,110,0.45)' },
  metal: { main: '#ffffff', dark: '#8e9cc0', glow: 'rgba(190,205,235,0.5)' },
  earth: { main: '#ffd9a3', dark: '#9c6b35', glow: 'rgba(220,170,100,0.45)' },
};

export function ElementCharacter({ element, size = 96 }: { element: ElementKey; size?: number }) {
  const p = PALETTE[element];
  const gid = `grad-${element}`;
  return (
    <svg width={size} height={size * 1.15} viewBox="0 0 100 115" aria-label={element}>
      <defs>
        <radialGradient id={gid} cx="50%" cy="68%" r="75%">
          <stop offset="0%" stopColor={p.main} />
          <stop offset="100%" stopColor={p.dark} />
        </radialGradient>
      </defs>
      {/* 팔 */}
      <ellipse cx="11" cy="64" rx="13" ry="5.5" fill={p.dark} transform="rotate(26 11 64)" />
      <ellipse cx="89" cy="64" rx="13" ry="5.5" fill={p.dark} transform="rotate(-26 89 64)" />
      {/* 다리 */}
      <rect x="31" y="90" width="10" height="18" rx="5" fill={p.dark} />
      <rect x="59" y="90" width="10" height="18" rx="5" fill={p.dark} />
      {/* 몸통 블롭 */}
      <path
        d="M50 8 C74 10 87 30 85 53 C83 78 69 94 50 94 C31 94 17 78 15 53 C13 30 26 10 50 8 Z"
        fill={`url(#${gid})`}
        style={{ filter: `drop-shadow(0 0 14px ${p.glow})` }}
      />
      {/* 머리 장식 */}
      {element === 'fire' && (
        <path d="M50 0 C58 8 56 16 50 20 C44 16 42 8 50 0 Z" fill={p.main} />
      )}
      {element === 'wood' && (
        <path d="M50 10 C60 -2 72 2 70 12 C62 18 52 16 50 10 Z" fill="#3da45c" />
      )}
      {element === 'earth' && (
        <path d="M58 6 C64 -2 72 2 68 10 C63 13 58 11 58 6 Z" fill="#6ee7a0" />
      )}
      {(element === 'metal' || element === 'water') && (
        <ellipse cx="34" cy="24" rx="11" ry="5" fill="#fff"
          opacity={element === 'metal' ? 0.85 : 0.6} transform="rotate(-20 34 24)" />
      )}
      {/* 눈 */}
      <ellipse cx="40" cy="52" rx="7" ry="8" fill="#fff" />
      <ellipse cx="60" cy="52" rx="7" ry="8" fill="#fff" />
      <circle cx="41" cy="54" r="3.4" fill="#141428" />
      <circle cx="61" cy="54" r="3.4" fill="#141428" />
      {/* 입 */}
      <path d="M44 66 Q50 72 56 66" stroke="#2a1530" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}
