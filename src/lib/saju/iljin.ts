import { Solar } from 'lunar-javascript';
import type { ElementDist, ElementKey } from './types';
import { ganToElement, zhiToElement } from './elements';

export interface Iljin {
  ganZhi: string;
  elements: ElementKey[];
}

export function getIljin(date: Date): Iljin {
  const solar = Solar.fromYmdHms(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
    12,
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
}

const ILJIN_WEIGHT = 2;

export function applyIljin(
  teamDist: ElementDist,
  iljin: Iljin,
): ElementDist {
  const out = { ...teamDist };
  for (const el of iljin.elements) {
    out[el] += ILJIN_WEIGHT;
  }
  return out;
}
