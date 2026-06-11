import type { ElementKey } from './types';

const GAN_ELEMENT: Record<string, ElementKey> = {
  甲: 'wood',
  乙: 'wood',
  丙: 'fire',
  丁: 'fire',
  戊: 'earth',
  己: 'earth',
  庚: 'metal',
  辛: 'metal',
  壬: 'water',
  癸: 'water',
};

const ZHI_ELEMENT: Record<string, ElementKey> = {
  寅: 'wood',
  卯: 'wood',
  巳: 'fire',
  午: 'fire',
  辰: 'earth',
  戌: 'earth',
  丑: 'earth',
  未: 'earth',
  申: 'metal',
  酉: 'metal',
  亥: 'water',
  子: 'water',
};

export function ganToElement(gan: string): ElementKey {
  const el = GAN_ELEMENT[gan];
  if (!el) throw new Error(`알 수 없는 천간: ${gan}`);
  return el;
}

export function zhiToElement(zhi: string): ElementKey {
  const el = ZHI_ELEMENT[zhi];
  if (!el) throw new Error(`알 수 없는 지지: ${zhi}`);
  return el;
}

// 상생: 목→화→토→금→수→목
const GENERATES: Record<ElementKey, ElementKey> = {
  wood: 'fire',
  fire: 'earth',
  earth: 'metal',
  metal: 'water',
  water: 'wood',
};

// 상극: 목→토, 토→수, 수→화, 화→금, 금→목
const CONTROLS: Record<ElementKey, ElementKey> = {
  wood: 'earth',
  earth: 'water',
  water: 'fire',
  fire: 'metal',
  metal: 'wood',
};

export type Relation = 'generates' | 'generated' | 'controls' | 'controlled' | 'same';

export function relation(a: ElementKey, b: ElementKey): Relation {
  if (a === b) return 'same';
  if (GENERATES[a] === b) return 'generates';
  if (GENERATES[b] === a) return 'generated';
  if (CONTROLS[a] === b) return 'controls';
  return 'controlled'; // 5행 구조상 남는 관계는 b가 a를 극하는 경우뿐
}

export { CONTROLS };
