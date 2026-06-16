import Image from 'next/image';
import type { ElementKey } from '@/lib/saju/types';

const SRC: Record<ElementKey, string> = {
  fire: '/characters/fire.png',
  water: '/characters/water.png',
  wood: '/characters/wood.png',
  metal: '/characters/metal.png',
  earth: '/characters/earth.png',
};

// 오행별 글로우 — 다크 네온 배경에서 캐릭터가 떠 보이도록
const GLOW: Record<ElementKey, string> = {
  fire: 'rgba(255,90,80,0.55)',
  water: 'rgba(80,170,255,0.5)',
  wood: 'rgba(110,210,110,0.5)',
  metal: 'rgba(200,210,235,0.45)',
  earth: 'rgba(240,184,110,0.5)',
};

export function ElementCharacter({ element, size = 96 }: { element: ElementKey; size?: number }) {
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-full"
      style={{ width: size, height: size, boxShadow: `0 0 ${Math.round(size * 0.28)}px ${GLOW[element]}` }}
    >
      <Image
        src={SRC[element]}
        alt={element}
        fill
        sizes={`${size}px`}
        className="scale-105 object-cover"
        priority={size >= 80}
      />
    </div>
  );
}
