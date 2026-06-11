import { Solar } from 'lunar-javascript';
import type { ElementDist, ElementKey, Iljin } from './types';
import { ganToElement, zhiToElement } from './elements';

export { type Iljin } from './types';

export function getIljin(date: Date): Iljin {
  // Validate date is valid before passing to lunar-javascript
  if (!Number.isFinite(date.getTime())) {
    throw new Error('Invalid date provided to getIljin');
  }

  try {
    const solar = Solar.fromYmdHms(
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate(),
      12, // noon (자시 경계 처리를 위해 고정)
      0,
      0,
    );
    const lunar = solar.getLunar();
    const gan = lunar.getDayGan();
    const zhi = lunar.getDayZhi();
    return {
      ganZhi: gan + zhi,
      elements: [ganToElement(gan), zhiToElement(zhi)],
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to calculate iljin for date ${date.toISOString()}: ${message}`);
  }
}

// 일진의 오행 가중치: 각 오행당 +2씩 추가
// (팀원 개별 기둥은 1씩, 일진은 팀 전체에 영향을 주므로 가중)
const ILJIN_WEIGHT = 2;

export function applyIljin(
  teamDist: ElementDist,
  iljin: Iljin,
): ElementDist {
  // 원본 불변성 보장: 새로운 객체 반환
  const result = { ...teamDist };
  for (const el of iljin.elements) {
    result[el] += ILJIN_WEIGHT;
  }
  return result;
}
