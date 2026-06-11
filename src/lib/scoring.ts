import type { ElementKey, FoodItem, ScoredFood } from './saju/types';
import { CONTROLS } from './saju/elements';
import { hashSeed } from './seed';

interface Judgement {
  excess: ElementKey[];
  lacking: ElementKey[];
}

export function scoreFoods(
  judgement: Judgement,
  foods: FoodItem[],
  seed: string,
  excludeIds: string[] = [],
): ScoredFood[] {
  const controllers = judgement.excess.map(
    (ex) => (Object.keys(CONTROLS) as ElementKey[]).find((k) => CONTROLS[k] === ex)!,
  );
  return foods
    .filter((f) => !excludeIds.includes(f.id))
    .map((f) => {
      let score = 0;
      for (const el of f.elements) {
        if (judgement.lacking.includes(el)) score += 3;
        if (controllers.includes(el)) score += 2;
        if (judgement.excess.includes(el)) score -= 2;
      }
      return { ...f, score };
    })
    .sort((a, b) => b.score - a.score || hashSeed(seed + a.id) - hashSeed(seed + b.id));
}
