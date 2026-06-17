'use client';

import Image from 'next/image';
import { useState } from 'react';

interface Props {
  id: string;
  name: string;
  emoji: string; // 이미지 로드 실패 시 폴백
  size: number;
  className?: string;
}

// 메뉴 일러스트(/foods/{id}.png)를 표시하고, 실패 시 이모지로 폴백
export function FoodImage({ id, name, emoji, size, className }: Props) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span role="img" aria-label={name} style={{ fontSize: Math.round(size * 0.72), lineHeight: 1 }}>
        {emoji}
      </span>
    );
  }

  return (
    <Image
      src={`/foods/${id}.webp`}
      alt={name}
      width={size}
      height={size}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
