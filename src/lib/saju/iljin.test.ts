import { describe, it, expect } from 'vitest';
import { getIljin, applyIljin } from './iljin';
import { emptyDist } from './types';

describe('일진', () => {
  it('고정 날짜의 일진은 결정적이고 간+지 2글자', () => {
    const date = new Date(2026, 5, 11); // 2026-06-11
    const a = getIljin(date);
    const b = getIljin(date);
    expect(a).toEqual(b);
    expect(a.ganZhi).toHaveLength(2);
    expect(a.elements).toHaveLength(2);
  });
  it('일진 오행에 각 +2 가중한다', () => {
    const dist = { ...emptyDist(), fire: 4, water: 2 };
    const out = applyIljin(dist, { ganZhi: '丙午', elements: ['fire', 'fire'] });
    expect(out.fire).toBe(8); // 4 + 2 + 2
    expect(out.water).toBe(2);
    expect(dist.fire).toBe(4); // 원본 불변
  });
});
