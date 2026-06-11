import { describe, it, expect } from 'vitest';
import { ganToElement, zhiToElement, relation } from './elements';

describe('간지→오행 매핑', () => {
  it('천간을 오행으로 변환한다', () => {
    expect(ganToElement('甲')).toBe('wood');
    expect(ganToElement('丙')).toBe('fire');
    expect(ganToElement('戊')).toBe('earth');
    expect(ganToElement('庚')).toBe('metal');
    expect(ganToElement('壬')).toBe('water');
  });

  it('지지를 오행으로 변환한다', () => {
    expect(zhiToElement('寅')).toBe('wood');
    expect(zhiToElement('午')).toBe('fire');
    expect(zhiToElement('辰')).toBe('earth');
    expect(zhiToElement('酉')).toBe('metal');
    expect(zhiToElement('子')).toBe('water');
  });

  it('알 수 없는 글자는 throw', () => {
    expect(() => ganToElement('?')).toThrow();
  });
});

describe('상생상극', () => {
  it('목생화 — wood가 fire를 생한다', () => {
    expect(relation('wood', 'fire')).toBe('generates');
    expect(relation('fire', 'wood')).toBe('generated');
  });

  it('수극화 — water가 fire를 극한다', () => {
    expect(relation('water', 'fire')).toBe('controls');
    expect(relation('fire', 'water')).toBe('controlled');
  });

  it('같은 오행은 same', () => {
    expect(relation('earth', 'earth')).toBe('same');
  });
});
