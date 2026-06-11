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

  it('알려진 날짜의 일진은 올바르다', () => {
    // 2026-06-11의 일진: 병진(丙辰) → fire + earth
    const date = new Date(2026, 5, 11);
    const iljin = getIljin(date);
    expect(iljin.ganZhi).toBe('丙辰');
    expect(iljin.elements).toEqual(['fire', 'earth']);
  });

  it('유효하지 않은 Date는 throw 한다', () => {
    const invalidDate = new Date(NaN);
    expect(() => getIljin(invalidDate)).toThrow('Invalid date provided to getIljin');
  });

  it('string으로 생성한 유효하지 않은 Date는 throw 한다', () => {
    const invalidDate = new Date('not-a-date');
    expect(() => getIljin(invalidDate)).toThrow('Invalid date provided to getIljin');
  });

  it('일진 오행에 각 +2 가중한다', () => {
    const dist = { ...emptyDist(), fire: 4, water: 2 };
    const out = applyIljin(dist, { ganZhi: '丙午', elements: ['fire', 'fire'] });
    expect(out.fire).toBe(8); // 4 + 2 + 2
    expect(out.water).toBe(2);
    expect(dist.fire).toBe(4); // 원본 불변
  });

  it('applyIljin은 원본을 수정하지 않는다', () => {
    const original = { ...emptyDist(), wood: 5, metal: 3 };
    const copy = { ...original };
    applyIljin(original, { ganZhi: '木火', elements: ['wood', 'fire'] });
    expect(original).toEqual(copy);
  });

  it('일진 각 오행별 가중을 정확히 적용한다', () => {
    const dist = { ...emptyDist(), fire: 4 };
    // 화토(火土) → fire + earth 각 +2
    const out = applyIljin(dist, { ganZhi: '丙辰', elements: ['fire', 'earth'] });
    expect(out.fire).toBe(6); // 4 + 2
    expect(out.earth).toBe(2); // 0 + 2
    expect(out.water).toBe(0);
  });
});
