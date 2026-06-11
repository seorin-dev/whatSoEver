import { describe, it, expect } from 'vitest';
import { computeMemberSaju } from './pillars';

describe('computeMemberSaju', () => {
  it('1984-06-01 출생의 연주는 갑자(甲子)', () => {
    const s = computeMemberSaju({ name: '갑자', birthDate: '1984-06-01', birthHour: 12 });
    expect(s.pillarGlyphs[0]).toBe('甲');
    expect(s.pillarGlyphs[1]).toBe('子');
  });
  it('시간 입력 시 8글자, 미입력 시 6글자', () => {
    const withHour = computeMemberSaju({ name: 'a', birthDate: '1993-05-14', birthHour: 12 });
    const noHour = computeMemberSaju({ name: 'a', birthDate: '1993-05-14', birthHour: null });
    expect(withHour.pillarGlyphs).toHaveLength(8);
    expect(noHour.pillarGlyphs).toHaveLength(6);
  });
  it('오행 분포 합 = 글자 수', () => {
    const s = computeMemberSaju({ name: 'a', birthDate: '1996-11-02', birthHour: 9 });
    const total = Object.values(s.dist).reduce((a, b) => a + b, 0);
    expect(total).toBe(8);
  });
  it('같은 입력이면 항상 같은 결과 (결정적)', () => {
    const input = { name: 'a', birthDate: '1990-03-15', birthHour: 15 };
    expect(computeMemberSaju(input)).toEqual(computeMemberSaju(input));
  });
  it('일간과 일간 오행이 채워진다', () => {
    const s = computeMemberSaju({ name: 'a', birthDate: '1984-06-01', birthHour: null });
    expect(s.dayGan).toBe(s.pillarGlyphs[4]); // 연간,연지,월간,월지,일간 순
    expect(['wood', 'fire', 'earth', 'metal', 'water']).toContain(s.dayGanElement);
  });
});
