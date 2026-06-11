import type { ElementDist, ElementKey } from './types';
import { ELEMENT_KEYS, emptyDist } from './types';

export function sumDists(dists: ElementDist[]): ElementDist {
  const sum = emptyDist();
  for (const d of dists) {
    for (const k of ELEMENT_KEYS) {
      sum[k] += d[k];
    }
  }
  return sum;
}

export function toPct(dist: ElementDist): Record<ElementKey, number> {
  const total = ELEMENT_KEYS.reduce((a, k) => a + dist[k], 0);
  const pct = emptyDist();
  if (total === 0) return pct;
  for (const k of ELEMENT_KEYS) {
    pct[k] = Math.round((dist[k] / total) * 100);
  }
  return pct;
}

export function judge(pct: Record<ElementKey, number>): {
  excess: ElementKey[];
  lacking: ElementKey[];
} {
  return {
    excess: ELEMENT_KEYS.filter((k) => pct[k] >= 35),
    lacking: ELEMENT_KEYS.filter((k) => pct[k] <= 10),
  };
}
