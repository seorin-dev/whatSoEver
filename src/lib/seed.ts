// djb2 — 같은 문자열이면 항상 같은 값 (템플릿 선택/타이브레이크용)
export function hashSeed(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h;
}

export function pick<T>(arr: T[], seed: string): T {
  return arr[hashSeed(seed) % arr.length];
}
