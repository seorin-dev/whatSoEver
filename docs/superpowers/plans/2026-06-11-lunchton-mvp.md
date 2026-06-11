# 점심팔자 MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 팀원 사주(생년월일시)와 오늘 일진으로 점심 메뉴를 추천하는 웹 서비스 — 입력 → 룰렛 → 결과(메뉴 1~3위 + 유머 해설 + 오행 차트 + 궁합 페어).

**Architecture:** 사주 계산은 클라이언트의 결정적 순수 함수 모듈(사주 엔진), 유머 해설만 `/api/recommend`에서 Claude API로 생성(8초 타임아웃 시 템플릿 폴백). 팀 저장은 로컬스토리지. 서버 DB 없음.

**Tech Stack:** Next.js(App Router) + TypeScript + Tailwind CSS v4 · lunar-javascript(만세력) · Recharts(도넛 차트) · @anthropic-ai/sdk · Vitest · Vercel

**디자인:** 다크 네온(엘리멘탈의 밤) + 오행 꼬마 캐릭터 5종 SVG(불똥이·방울이·새싹이·반짝이·흙돌이).

**설계 결정 메모:**
- 매운맛은 전통 오미상 금(金)이지만, 대중 직관에 맞춰 **매운맛=화(火)**로 매핑한다 (재미 서비스 우선).
- 음식 1개당 오행 태그는 최대 2개 (스코어링 균형 유지).
- 시진 미입력 멤버는 정오가 아니라 **시주 자체를 제외**(6글자 계산).

---

## 파일 구조

```
src/
├── app/
│   ├── layout.tsx               # 다크 네온 베이스 + 폰트
│   ├── globals.css              # 디자인 토큰 (@theme)
│   ├── page.tsx                 # 단일 페이지 상태머신: input → spin → result
│   └── api/recommend/route.ts   # Claude 호출 (서버 전용)
├── lib/
│   ├── saju/
│   │   ├── types.ts             # 공유 타입 전부
│   │   ├── elements.ts          # 간지→오행 매핑, 상생상극
│   │   ├── pillars.ts           # 개인 사주 계산 (lunar-javascript)
│   │   ├── team.ts              # 팀 합산, 과다/부족
│   │   ├── compat.ts            # 1:1 궁합, 최고/최악 페어
│   │   ├── iljin.ts             # 오늘 일진 + 가중
│   │   └── index.ts             # analyzeTeam() 단일 진입점
│   ├── foods.ts                 # 음식 DB 44개
│   ├── scoring.ts               # 메뉴 스코어링
│   ├── seed.ts                  # 결정적 해시 (템플릿/타이브레이크용)
│   ├── fallback.ts              # 폴백 해설 템플릿 (서버/클라 공용)
│   ├── recommend.ts             # LLM 호출 오케스트레이션 + 폴백 (서버)
│   ├── recommend-client.ts      # 클라이언트 fetch 헬퍼 (실패 시 로컬 폴백)
│   └── storage.ts               # 팀 저장/불러오기 (localStorage)
├── components/
│   ├── ElementCharacter.tsx     # 오행 캐릭터 SVG 5종
│   ├── TeamForm.tsx             # 입력 화면
│   ├── Roulette.tsx             # 룰렛 (1위에 멈춤)
│   ├── ElementChart.tsx         # 오행 도넛 차트
│   ├── PairCard.tsx             # 최고/최악 페어
│   └── ResultView.tsx           # 결과 화면 조립
└── types/lunar-javascript.d.ts  # 타입 선언 (any)
tests → 각 모듈 옆 *.test.ts (Vitest)
```

---

### Task 1: 프로젝트 스캐폴딩

**Files:**
- Create: Next.js 프로젝트 전체, `vitest.config.ts`, `src/types/lunar-javascript.d.ts`

- [ ] **Step 1: Next.js 생성 (비어있지 않은 디렉토리 우회)**

```bash
cd /Users/baedong-yeon/Documents/lunchton
npx create-next-app@latest tmp-app --ts --tailwind --eslint --app --src-dir --use-npm --import-alias "@/*"
rsync -a tmp-app/ ./ --exclude .git
rm -rf tmp-app
```

- [ ] **Step 2: 의존성 설치**

```bash
npm i lunar-javascript recharts @anthropic-ai/sdk
npm i -D vitest
```

- [ ] **Step 3: Vitest 설정 — Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: { environment: 'node' },
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
});
```

`package.json`의 scripts에 추가: `"test": "vitest run", "test:watch": "vitest"`

- [ ] **Step 4: lunar-javascript 타입 선언 — Create `src/types/lunar-javascript.d.ts`**

```ts
declare module 'lunar-javascript' {
  export const Solar: any;
  export const Lunar: any;
}
```

- [ ] **Step 5: 빌드/테스트 동작 확인**

Run: `npm run build && npx vitest run --passWithNoTests`
Expected: 빌드 성공, "No test files found" 통과

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "chore: Next.js + Vitest 스캐폴딩"
```

---

### Task 2: 사주 타입 + 오행 매핑

**Files:**
- Create: `src/lib/saju/types.ts`, `src/lib/saju/elements.ts`
- Test: `src/lib/saju/elements.test.ts`

- [ ] **Step 1: 타입 정의 — Create `src/lib/saju/types.ts`**

```ts
export type ElementKey = 'wood' | 'fire' | 'earth' | 'metal' | 'water';

export const ELEMENT_KEYS: ElementKey[] = ['wood', 'fire', 'earth', 'metal', 'water'];

export const ELEMENT_LABEL: Record<ElementKey, string> = {
  wood: '목(木)', fire: '화(火)', earth: '토(土)', metal: '금(金)', water: '수(水)',
};

export const ELEMENT_CHARACTER: Record<ElementKey, string> = {
  wood: '새싹이', fire: '불똥이', earth: '흙돌이', metal: '반짝이', water: '방울이',
};

export interface MemberInput {
  name: string;
  birthDate: string;        // 'YYYY-MM-DD'
  birthHour: number | null; // 0~23, null = 시간 모름(시주 제외)
}

export type ElementDist = Record<ElementKey, number>; // 오행별 글자 수

export interface MemberSaju {
  name: string;
  dayGan: string;            // 일간 한자, 예: '甲'
  dayGanElement: ElementKey;
  pillarGlyphs: string[];    // 간지 글자 배열 (6 또는 8글자)
  dist: ElementDist;
}

export interface PairResult { a: string; b: string; score: number; }

export interface TeamAnalysis {
  teamName: string;
  members: MemberSaju[];
  teamDist: ElementDist;
  teamPct: Record<ElementKey, number>; // 일진 가중 반영 후 백분율
  excess: ElementKey[];                // pct >= 35
  lacking: ElementKey[];               // pct <= 10
  iljin: { ganZhi: string; elements: ElementKey[] };
  bestPair: PairResult;
  worstPair: PairResult;
}

export interface FoodItem {
  id: string;
  name: string;
  emoji: string;
  elements: ElementKey[];    // 최대 2개
}

export interface ScoredFood extends FoodItem { score: number; }

export interface RecommendResult {
  top3: { id: string; name: string; emoji: string; comment: string }[];
  summary: string;
  pairComment: { best: string; worst: string };
  source: 'llm' | 'fallback';
}

export function emptyDist(): ElementDist {
  return { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
}
```

- [ ] **Step 2: 실패하는 테스트 작성 — Create `src/lib/saju/elements.test.ts`**

```ts
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
```

- [ ] **Step 3: 실패 확인**

Run: `npx vitest run src/lib/saju/elements.test.ts`
Expected: FAIL — "Cannot find module './elements'"

- [ ] **Step 4: 구현 — Create `src/lib/saju/elements.ts`**

```ts
import type { ElementKey } from './types';

const GAN_ELEMENT: Record<string, ElementKey> = {
  甲: 'wood', 乙: 'wood', 丙: 'fire', 丁: 'fire', 戊: 'earth',
  己: 'earth', 庚: 'metal', 辛: 'metal', 壬: 'water', 癸: 'water',
};

const ZHI_ELEMENT: Record<string, ElementKey> = {
  寅: 'wood', 卯: 'wood', 巳: 'fire', 午: 'fire',
  辰: 'earth', 戌: 'earth', 丑: 'earth', 未: 'earth',
  申: 'metal', 酉: 'metal', 亥: 'water', 子: 'water',
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
  wood: 'fire', fire: 'earth', earth: 'metal', metal: 'water', water: 'wood',
};
// 상극: 목→토, 토→수, 수→화, 화→금, 금→목
const CONTROLS: Record<ElementKey, ElementKey> = {
  wood: 'earth', earth: 'water', water: 'fire', fire: 'metal', metal: 'wood',
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
```

- [ ] **Step 5: 통과 확인**

Run: `npx vitest run src/lib/saju/elements.test.ts`
Expected: PASS (8 tests)

- [ ] **Step 6: Commit**

```bash
git add src/lib/saju && git commit -m "feat: 사주 타입 및 간지-오행 매핑"
```

---

### Task 3: 개인 사주 계산 (pillars)

**Files:**
- Create: `src/lib/saju/pillars.ts`
- Test: `src/lib/saju/pillars.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성 — Create `src/lib/saju/pillars.test.ts`**

1984년은 갑자(甲子)년이라는 역사적 사실을 앵커로 사용한다(입춘 이후인 6월 출생으로 경계 문제 회피).

```ts
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
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/lib/saju/pillars.test.ts`
Expected: FAIL — "Cannot find module './pillars'"

- [ ] **Step 3: 구현 — Create `src/lib/saju/pillars.ts`**

```ts
import { Solar } from 'lunar-javascript';
import type { ElementKey, MemberInput, MemberSaju } from './types';
import { emptyDist } from './types';
import { ganToElement, zhiToElement } from './elements';

// 글자 배열 순서: [연간, 연지, 월간, 월지, 일간, 일지, (시간, 시지)]
// 짝수 인덱스 = 천간, 홀수 인덱스 = 지지
export function computeMemberSaju(input: MemberInput): MemberSaju {
  const [y, m, d] = input.birthDate.split('-').map(Number);
  const hour = input.birthHour ?? 12; // 시주 미사용이어도 라이브러리 입력값은 필요
  const solar = Solar.fromYmdHms(y, m, d, hour, 0, 0);
  const ec = solar.getLunar().getEightChar();

  const glyphs: string[] = [
    ec.getYearGan(), ec.getYearZhi(),
    ec.getMonthGan(), ec.getMonthZhi(),
    ec.getDayGan(), ec.getDayZhi(),
  ];
  if (input.birthHour !== null) glyphs.push(ec.getTimeGan(), ec.getTimeZhi());

  const dist = emptyDist();
  glyphs.forEach((glyph, i) => {
    const el: ElementKey = i % 2 === 0 ? ganToElement(glyph) : zhiToElement(glyph);
    dist[el] += 1;
  });

  const dayGan = glyphs[4];
  return {
    name: input.name,
    dayGan,
    dayGanElement: ganToElement(dayGan),
    pillarGlyphs: glyphs,
    dist,
  };
}
```

- [ ] **Step 4: 통과 확인 + 만세력 대조**

Run: `npx vitest run src/lib/saju/pillars.test.ts`
Expected: PASS (5 tests)

추가 검증(수동 1회): `npx tsx -e "..."` 또는 테스트에 `console.log`를 잠깐 넣어 1993-05-14의 8글자를 출력하고, 포스텔러/만세력 사이트와 일간이 일치하는지 확인한다. 불일치하면 lunar-javascript의 EightChar 절입 기준 문제이므로 즉시 보고.

- [ ] **Step 5: Commit**

```bash
git add src/lib/saju && git commit -m "feat: 개인 사주 오행 분포 계산"
```

---

### Task 4: 팀 오행 합산 + 과다/부족 판정

**Files:**
- Create: `src/lib/saju/team.ts`
- Test: `src/lib/saju/team.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성 — Create `src/lib/saju/team.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { sumDists, toPct, judge } from './team';
import { emptyDist } from './types';

function dist(partial: Partial<Record<string, number>>) {
  return { ...emptyDist(), ...partial } as ReturnType<typeof emptyDist>;
}

describe('팀 오행 합산', () => {
  it('멤버 분포를 합산한다', () => {
    const sum = sumDists([dist({ fire: 3, water: 1 }), dist({ fire: 2, wood: 2 })]);
    expect(sum.fire).toBe(5);
    expect(sum.wood).toBe(2);
    expect(sum.water).toBe(1);
  });
  it('백분율 합은 100 근처(반올림 오차 ±2)', () => {
    const pct = toPct(dist({ fire: 5, wood: 2, water: 1 }));
    const total = Object.values(pct).reduce((a, b) => a + b, 0);
    expect(total).toBeGreaterThanOrEqual(98);
    expect(total).toBeLessThanOrEqual(102);
  });
  it('35% 이상은 과다, 10% 이하는 부족', () => {
    // fire 8/16=50%, water 0/16=0%, wood 4, earth 4 (각 25%)
    const { excess, lacking } = judge(toPct(dist({ fire: 8, wood: 4, earth: 4 })));
    expect(excess).toContain('fire');
    expect(lacking).toContain('water');
    expect(lacking).toContain('metal');
    expect(excess).not.toContain('wood');
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/lib/saju/team.test.ts`
Expected: FAIL — "Cannot find module './team'"

- [ ] **Step 3: 구현 — Create `src/lib/saju/team.ts`**

```ts
import type { ElementDist, ElementKey } from './types';
import { ELEMENT_KEYS, emptyDist } from './types';

export function sumDists(dists: ElementDist[]): ElementDist {
  const sum = emptyDist();
  for (const d of dists) for (const k of ELEMENT_KEYS) sum[k] += d[k];
  return sum;
}

export function toPct(dist: ElementDist): Record<ElementKey, number> {
  const total = ELEMENT_KEYS.reduce((a, k) => a + dist[k], 0);
  const pct = emptyDist();
  if (total === 0) return pct;
  for (const k of ELEMENT_KEYS) pct[k] = Math.round((dist[k] / total) * 100);
  return pct;
}

export function judge(pct: Record<ElementKey, number>): {
  excess: ElementKey[]; lacking: ElementKey[];
} {
  return {
    excess: ELEMENT_KEYS.filter((k) => pct[k] >= 35),
    lacking: ELEMENT_KEYS.filter((k) => pct[k] <= 10),
  };
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/lib/saju/team.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/saju && git commit -m "feat: 팀 오행 합산 및 과다/부족 판정"
```

---

### Task 5: 1:1 궁합 + 최고/최악 페어

**Files:**
- Create: `src/lib/saju/compat.ts`
- Test: `src/lib/saju/compat.test.ts`

궁합 점수 규칙(일간 오행 기준): 상생(어느 방향이든) **+2**, 동일 오행 **+1**, 상극(어느 방향이든) **−2**.

- [ ] **Step 1: 실패하는 테스트 작성 — Create `src/lib/saju/compat.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { pairScore, findPairs } from './compat';
import type { MemberSaju } from './types';
import { emptyDist } from './types';

function fakeMember(name: string, dayGanElement: MemberSaju['dayGanElement']): MemberSaju {
  return { name, dayGan: '?', dayGanElement, pillarGlyphs: [], dist: emptyDist() };
}

describe('궁합 점수', () => {
  it('상생(목→화)은 +2', () => {
    expect(pairScore(fakeMember('a', 'wood'), fakeMember('b', 'fire'))).toBe(2);
  });
  it('상극(수↔화)은 -2', () => {
    expect(pairScore(fakeMember('a', 'water'), fakeMember('b', 'fire'))).toBe(-2);
  });
  it('동일 오행은 +1', () => {
    expect(pairScore(fakeMember('a', 'earth'), fakeMember('b', 'earth'))).toBe(1);
  });
});

describe('최고/최악 페어', () => {
  it('전체 쌍에서 최고와 최악을 찾는다', () => {
    const members = [
      fakeMember('철수', 'wood'),  // 철수-영희: 상생 +2
      fakeMember('영희', 'fire'),  // 영희-민수: 상극 -2 (수극화)
      fakeMember('민수', 'water'), // 철수-민수: 상생 +2 (수생목)
    ];
    const { best, worst } = findPairs(members);
    expect(worst.a).toBe('영희');
    expect(worst.b).toBe('민수');
    expect(worst.score).toBe(-2);
    expect(best.score).toBe(2);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/lib/saju/compat.test.ts`
Expected: FAIL — "Cannot find module './compat'"

- [ ] **Step 3: 구현 — Create `src/lib/saju/compat.ts`**

```ts
import type { MemberSaju, PairResult } from './types';
import { relation } from './elements';

export function pairScore(a: MemberSaju, b: MemberSaju): number {
  switch (relation(a.dayGanElement, b.dayGanElement)) {
    case 'generates':
    case 'generated':
      return 2;
    case 'same':
      return 1;
    case 'controls':
    case 'controlled':
      return -2;
  }
}

// 동점이면 먼저 만난 쌍 유지 (결정적)
export function findPairs(members: MemberSaju[]): { best: PairResult; worst: PairResult } {
  let best: PairResult | null = null;
  let worst: PairResult | null = null;
  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      const score = pairScore(members[i], members[j]);
      const pair = { a: members[i].name, b: members[j].name, score };
      if (!best || score > best.score) best = pair;
      if (!worst || score < worst.score) worst = pair;
    }
  }
  if (!best || !worst) throw new Error('멤버는 2명 이상이어야 합니다');
  return { best, worst };
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/lib/saju/compat.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/saju && git commit -m "feat: 일간 기반 1:1 궁합 및 최고/최악 페어"
```

---

### Task 6: 오늘의 일진 + 가중 반영

**Files:**
- Create: `src/lib/saju/iljin.ts`
- Test: `src/lib/saju/iljin.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성 — Create `src/lib/saju/iljin.test.ts`**

```ts
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
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/lib/saju/iljin.test.ts`
Expected: FAIL — "Cannot find module './iljin'"

- [ ] **Step 3: 구현 — Create `src/lib/saju/iljin.ts`**

```ts
import { Solar } from 'lunar-javascript';
import type { ElementDist, ElementKey } from './types';
import { ganToElement, zhiToElement } from './elements';

export interface Iljin { ganZhi: string; elements: ElementKey[]; }

export function getIljin(date: Date): Iljin {
  const solar = Solar.fromYmdHms(
    date.getFullYear(), date.getMonth() + 1, date.getDate(), 12, 0, 0,
  );
  const lunar = solar.getLunar();
  const gan = lunar.getDayGan();
  const zhi = lunar.getDayZhi();
  return { ganZhi: gan + zhi, elements: [ganToElement(gan), zhiToElement(zhi)] };
}

const ILJIN_WEIGHT = 2;

export function applyIljin(teamDist: ElementDist, iljin: Iljin): ElementDist {
  const out = { ...teamDist };
  for (const el of iljin.elements) out[el] += ILJIN_WEIGHT;
  return out;
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/lib/saju/iljin.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/saju && git commit -m "feat: 오늘의 일진 계산 및 팀 오행 가중"
```

---

### Task 7: 엔진 진입점 analyzeTeam

**Files:**
- Create: `src/lib/saju/index.ts`
- Test: `src/lib/saju/index.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성 — Create `src/lib/saju/index.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { analyzeTeam } from './index';

const members = [
  { name: '철수', birthDate: '1993-05-14', birthHour: 12 },
  { name: '영희', birthDate: '1996-11-02', birthHour: null },
  { name: '민수', birthDate: '1989-08-23', birthHour: 7 },
];

describe('analyzeTeam', () => {
  it('전체 분석 결과를 조립한다', () => {
    const a = analyzeTeam('개발1팀', members, new Date(2026, 5, 11));
    expect(a.teamName).toBe('개발1팀');
    expect(a.members).toHaveLength(3);
    expect(a.iljin.ganZhi).toHaveLength(2);
    expect(a.bestPair.score).toBeGreaterThanOrEqual(a.worstPair.score);
    const pctTotal = Object.values(a.teamPct).reduce((x, y) => x + y, 0);
    expect(pctTotal).toBeGreaterThanOrEqual(98);
  });
  it('날짜가 다르면 teamPct가 달라질 수 있다 (일진 반영 확인)', () => {
    const a = analyzeTeam('t', members, new Date(2026, 5, 11));
    const b = analyzeTeam('t', members, new Date(2026, 5, 12));
    expect(a.iljin.ganZhi).not.toBe(b.iljin.ganZhi);
  });
  it('멤버 1명이면 throw', () => {
    expect(() => analyzeTeam('t', members.slice(0, 1), new Date())).toThrow();
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/lib/saju/index.test.ts`
Expected: FAIL — analyzeTeam not exported

- [ ] **Step 3: 구현 — Create `src/lib/saju/index.ts`**

```ts
import type { MemberInput, TeamAnalysis } from './types';
import { computeMemberSaju } from './pillars';
import { sumDists, toPct, judge } from './team';
import { findPairs } from './compat';
import { getIljin, applyIljin } from './iljin';

export function analyzeTeam(
  teamName: string,
  inputs: MemberInput[],
  date: Date,
): TeamAnalysis {
  if (inputs.length < 2 || inputs.length > 8) {
    throw new Error('멤버는 2~8명이어야 합니다');
  }
  const members = inputs.map(computeMemberSaju);
  const iljin = getIljin(date);
  const teamDist = sumDists(members.map((m) => m.dist));
  const weighted = applyIljin(teamDist, iljin);
  const teamPct = toPct(weighted);
  const { excess, lacking } = judge(teamPct);
  const { best, worst } = findPairs(members);
  return {
    teamName, members, teamDist, teamPct, excess, lacking, iljin,
    bestPair: best, worstPair: worst,
  };
}

export * from './types';
```

- [ ] **Step 4: 통과 확인 (전체 엔진 테스트)**

Run: `npx vitest run src/lib/saju`
Expected: 전부 PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/saju && git commit -m "feat: 사주 엔진 진입점 analyzeTeam"
```

---

### Task 8: 음식 DB + 메뉴 스코어링

**Files:**
- Create: `src/lib/foods.ts`, `src/lib/seed.ts`, `src/lib/scoring.ts`
- Test: `src/lib/scoring.test.ts`

- [ ] **Step 1: 음식 DB — Create `src/lib/foods.ts`** (44개 전체)

```ts
import type { FoodItem } from './saju/types';

export const FOODS: FoodItem[] = [
  { id: 'mul-naengmyeon', name: '물냉면', emoji: '🍜', elements: ['water'] },
  { id: 'kong-guksu', name: '콩국수', emoji: '🥣', elements: ['water', 'earth'] },
  { id: 'mulhoe', name: '물회', emoji: '🐟', elements: ['water'] },
  { id: 'gul-gukbap', name: '굴국밥', emoji: '🦪', elements: ['water'] },
  { id: 'haemul-tang', name: '해물탕', emoji: '🦐', elements: ['water', 'fire'] },
  { id: 'sushi', name: '초밥', emoji: '🍣', elements: ['water', 'metal'] },
  { id: 'hoe-deopbap', name: '회덮밥', emoji: '🍚', elements: ['water', 'wood'] },
  { id: 'miyeok-guk', name: '미역국 정식', emoji: '🌊', elements: ['water'] },
  { id: 'kimchi-jjigae', name: '김치찌개', emoji: '🍲', elements: ['fire', 'earth'] },
  { id: 'maeun-tang', name: '매운탕', emoji: '🌶️', elements: ['fire', 'water'] },
  { id: 'buldak', name: '불닭', emoji: '🔥', elements: ['fire'] },
  { id: 'tteokbokki', name: '떡볶이', emoji: '🍢', elements: ['fire'] },
  { id: 'mala-tang', name: '마라탕', emoji: '🥘', elements: ['fire'] },
  { id: 'jeyuk-bokkeum', name: '제육볶음', emoji: '🥓', elements: ['fire', 'earth'] },
  { id: 'dak-galbi', name: '닭갈비', emoji: '🍗', elements: ['fire'] },
  { id: 'jjamppong', name: '짬뽕', emoji: '🍝', elements: ['fire', 'water'] },
  { id: 'bibimbap', name: '비빔밥', emoji: '🥗', elements: ['wood', 'earth'] },
  { id: 'salad-bowl', name: '샐러드볼', emoji: '🥬', elements: ['wood'] },
  { id: 'ssambap', name: '쌈밥', emoji: '🥬', elements: ['wood', 'earth'] },
  { id: 'bibim-guksu', name: '비빔국수', emoji: '🍜', elements: ['wood', 'fire'] },
  { id: 'wolnam-ssam', name: '월남쌈', emoji: '🌯', elements: ['wood', 'water'] },
  { id: 'tomato-pasta', name: '토마토 파스타', emoji: '🍝', elements: ['fire', 'wood'] },
  { id: 'cream-pasta', name: '크림 파스타', emoji: '🥛', elements: ['metal', 'earth'] },
  { id: 'donkatsu', name: '돈까스', emoji: '🍱', elements: ['earth', 'metal'] },
  { id: 'curry-rice', name: '카레라이스', emoji: '🍛', elements: ['earth', 'fire'] },
  { id: 'gimbap', name: '김밥', emoji: '🍙', elements: ['earth', 'wood'] },
  { id: 'baekban', name: '백반정식', emoji: '🍚', elements: ['earth'] },
  { id: 'sundubu', name: '순두부찌개', emoji: '🥘', elements: ['earth', 'fire'] },
  { id: 'galbi-tang', name: '갈비탕', emoji: '🍖', elements: ['earth', 'water'] },
  { id: 'seolleong-tang', name: '설렁탕', emoji: '🥛', elements: ['water', 'metal'] },
  { id: 'samgye-tang', name: '삼계탕', emoji: '🐔', elements: ['earth', 'water'] },
  { id: 'bossam', name: '보쌈정식', emoji: '🥩', elements: ['earth', 'water'] },
  { id: 'chicken', name: '치킨', emoji: '🍗', elements: ['fire', 'metal'] },
  { id: 'burger', name: '수제버거', emoji: '🍔', elements: ['fire', 'earth'] },
  { id: 'pizza', name: '피자', emoji: '🍕', elements: ['fire', 'earth'] },
  { id: 'pho', name: '쌀국수', emoji: '🍜', elements: ['water', 'wood'] },
  { id: 'udon', name: '우동', emoji: '🍲', elements: ['water', 'earth'] },
  { id: 'soba', name: '메밀소바', emoji: '🥢', elements: ['wood', 'water'] },
  { id: 'tendon', name: '텐동', emoji: '🍤', elements: ['metal', 'earth'] },
  { id: 'gyudon', name: '규동', emoji: '🥩', elements: ['earth', 'metal'] },
  { id: 'jajangmyeon', name: '짜장면', emoji: '🍜', elements: ['earth', 'fire'] },
  { id: 'tangsuyuk', name: '탕수육', emoji: '🍖', elements: ['metal', 'fire'] },
  { id: 'sandwich', name: '샌드위치', emoji: '🥪', elements: ['wood', 'metal'] },
  { id: 'poke', name: '포케', emoji: '🥗', elements: ['water', 'wood'] },
];
```

- [ ] **Step 2: 시드 해시 — Create `src/lib/seed.ts`**

```ts
// djb2 — 같은 문자열이면 항상 같은 값 (템플릿 선택/타이브레이크용)
export function hashSeed(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h;
}

export function pick<T>(arr: T[], seed: string): T {
  return arr[hashSeed(seed) % arr.length];
}
```

- [ ] **Step 3: 실패하는 테스트 작성 — Create `src/lib/scoring.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { scoreFoods } from './scoring';
import { FOODS } from './foods';
import type { ElementKey } from './saju/types';

const fireExcess = { excess: ['fire'] as ElementKey[], lacking: ['water'] as ElementKey[] };

describe('scoreFoods', () => {
  it('부족 기운(수) 음식이 과다 기운(화) 음식보다 높은 점수', () => {
    const scored = scoreFoods(fireExcess, FOODS, 'seed');
    const mul = scored.find((f) => f.id === 'mul-naengmyeon')!;
    const buldak = scored.find((f) => f.id === 'buldak')!;
    expect(mul.score).toBeGreaterThan(buldak.score);
  });
  it('점수 내림차순 정렬', () => {
    const scored = scoreFoods(fireExcess, FOODS, 'seed');
    for (let i = 1; i < scored.length; i++) {
      expect(scored[i - 1].score).toBeGreaterThanOrEqual(scored[i].score);
    }
  });
  it('excludeIds는 결과에서 제외된다', () => {
    const scored = scoreFoods(fireExcess, FOODS, 'seed', ['mul-naengmyeon']);
    expect(scored.find((f) => f.id === 'mul-naengmyeon')).toBeUndefined();
  });
  it('같은 시드면 같은 순서 (결정적)', () => {
    expect(scoreFoods(fireExcess, FOODS, 'x')).toEqual(scoreFoods(fireExcess, FOODS, 'x'));
  });
});
```

- [ ] **Step 4: 실패 확인**

Run: `npx vitest run src/lib/scoring.test.ts`
Expected: FAIL — "Cannot find module './scoring'"

- [ ] **Step 5: 구현 — Create `src/lib/scoring.ts`**

점수 규칙: 음식의 각 오행 태그에 대해 — 부족 기운이면 **+3**, 과다 기운을 극(control)하는 기운이면 **+2**, 과다 기운 자체면 **−2**. 동점은 시드 해시로 결정적 셔플.

```ts
import type { ElementKey, FoodItem, ScoredFood } from './saju/types';
import { CONTROLS } from './saju/elements';
import { hashSeed } from './seed';

interface Judgement { excess: ElementKey[]; lacking: ElementKey[]; }

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
```

- [ ] **Step 6: 통과 확인**

Run: `npx vitest run src/lib/scoring.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 7: Commit**

```bash
git add src/lib && git commit -m "feat: 음식 DB 44종 및 오행 기반 메뉴 스코어링"
```

---

### Task 9: 폴백 해설 템플릿

**Files:**
- Create: `src/lib/fallback.ts`
- Test: `src/lib/fallback.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성 — Create `src/lib/fallback.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { buildFallback } from './fallback';
import { scoreFoods } from './scoring';
import { FOODS } from './foods';
import { analyzeTeam } from './saju';

const members = [
  { name: '철수', birthDate: '1993-05-14', birthHour: 12 },
  { name: '영희', birthDate: '1996-11-02', birthHour: null },
];

describe('buildFallback', () => {
  it('상위 3개 메뉴와 모든 해설 필드를 채운다', () => {
    const analysis = analyzeTeam('팀', members, new Date(2026, 5, 11));
    const candidates = scoreFoods(analysis, FOODS, 'seed').slice(0, 8);
    const r = buildFallback(analysis, candidates, 'seed');
    expect(r.top3).toHaveLength(3);
    expect(r.top3[0].id).toBe(candidates[0].id); // 1위 = 최고 점수
    for (const t of r.top3) expect(t.comment.length).toBeGreaterThan(0);
    expect(r.summary.length).toBeGreaterThan(0);
    expect(r.pairComment.best).toContain(analysis.bestPair.a);
    expect(r.source).toBe('fallback');
  });
  it('같은 시드면 같은 결과 (결정적)', () => {
    const analysis = analyzeTeam('팀', members, new Date(2026, 5, 11));
    const candidates = scoreFoods(analysis, FOODS, 's').slice(0, 8);
    expect(buildFallback(analysis, candidates, 's'))
      .toEqual(buildFallback(analysis, candidates, 's'));
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/lib/fallback.test.ts`
Expected: FAIL — "Cannot find module './fallback'"

- [ ] **Step 3: 구현 — Create `src/lib/fallback.ts`**

```ts
import type { ElementKey, RecommendResult, ScoredFood, TeamAnalysis } from './saju/types';
import { ELEMENT_LABEL, ELEMENT_CHARACTER } from './saju/types';
import { pick } from './seed';

// 과다 기운 총평 템플릿 (오행별 2개)
const EXCESS_SUMMARY: Record<ElementKey, string[]> = {
  fire: [
    '팀 전체에 불기운이 활활. 사소한 말에도 불붙기 좋은 날이니 시원한 메뉴로 진화 필수.',
    '불똥이가 너무 많아요! 오늘 회의 언성 주의보. 일단 시원한 걸로 식히고 시작합시다.',
  ],
  water: [
    '물기운이 넘실넘실. 다들 축 처지기 쉬운 날 — 따뜻하고 든든한 메뉴로 텐션을 끌어올리세요.',
    '방울이 과다 출현. 오늘따라 결정이 안 나는 팀이라면, 메뉴라도 화끈하게 정합시다.',
  ],
  wood: [
    '새싹이가 무성하게 자란 팀. 아이디어는 많은데 수습이 안 될 때는 든든한 한 끼가 답.',
    '목기운 과다 — 의욕이 넘쳐 점심을 거를 위험! 일단 먹고 합시다.',
  ],
  metal: [
    '반짝이 기운이 가득. 다들 칼같이 일하는 날이니 부드러운 메뉴로 긴장을 풀어주세요.',
    '금기운 과다 — 완벽주의 발동 중. 메뉴 고민은 사주에 맡기고 그냥 드세요.',
  ],
  earth: [
    '흙돌이처럼 든든...하다 못해 무거운 팀. 가볍고 산뜻한 메뉴로 환기가 필요해요.',
    '토기운 과다 — 안정 지향의 날. 늘 가던 그 집 말고 오늘은 새 메뉴에 도전!',
  ],
};

const BALANCED_SUMMARY = [
  '오행이 고르게 균형 잡힌 팀! 뭘 먹어도 좋은 날이지만, 굳이 고르자면 이거예요.',
  '균형의 팀. 오늘은 운명보다 취향이 이기는 날 — 그래도 사주는 이 메뉴를 밀어봅니다.',
];

// 음식의 첫 번째 오행 태그 기준 추천 코멘트
const FOOD_COMMENT: Record<ElementKey, string[]> = {
  water: ['끓어오른 팀 분위기를 한 방에 식혀줄 물기운 충전 메뉴.', '오늘 부족한 수기운을 국물째 들이켜세요.'],
  fire: ['처진 기운에 불을 붙여줄 화끈한 선택.', '오늘은 매운맛이 곧 회복약. 불기운 보충 완료.'],
  wood: ['신선한 목기운으로 막힌 아이디어를 뚫어주는 메뉴.', '초록초록한 생기 충전. 오후 회의가 달라집니다.'],
  metal: ['반짝이는 금기운으로 마무리 집중력을 올려주는 메뉴.', '바삭한 금기운 — 오후 디테일 작업에 특효.'],
  earth: ['속을 든든하게 받쳐주는 토기운 안정 메뉴.', '흔들리는 팀 분위기에 무게중심을 잡아줄 한 끼.'],
};

const BEST_PAIR_COMMENT = [
  '{a} ♥ {b} — 오늘 같이 앉으면 점심값이 굳는 환상 궁합.',
  '{a} ♥ {b} — 오늘만큼은 메뉴 취향도 통할 운명의 페어.',
];
const WORST_PAIR_COMMENT = [
  '{a} ⚡ {b} — 국물 튀길 수 있음. 대각선 착석을 권장합니다.',
  '{a} ⚡ {b} — 오늘은 메뉴 얘기만. 깊은 대화는 내일로 미루세요.',
];

export function buildFallback(
  analysis: TeamAnalysis,
  candidates: ScoredFood[],
  seed: string,
): RecommendResult {
  const top3 = candidates.slice(0, 3).map((f, i) => ({
    id: f.id,
    name: f.name,
    emoji: f.emoji,
    comment: pick(FOOD_COMMENT[f.elements[0]], seed + f.id + i),
  }));

  const mainExcess = analysis.excess[0];
  const summaryPool = mainExcess ? EXCESS_SUMMARY[mainExcess] : BALANCED_SUMMARY;
  const lackNote = analysis.lacking.length
    ? ` (부족 기운: ${analysis.lacking.map((k) => ELEMENT_LABEL[k]).join(', ')} — ${ELEMENT_CHARACTER[analysis.lacking[0]]} 충전 필요)`
    : '';

  return {
    top3,
    summary: pick(summaryPool, seed + 'summary') + lackNote,
    pairComment: {
      best: pick(BEST_PAIR_COMMENT, seed + 'best')
        .replace('{a}', analysis.bestPair.a).replace('{b}', analysis.bestPair.b),
      worst: pick(WORST_PAIR_COMMENT, seed + 'worst')
        .replace('{a}', analysis.worstPair.a).replace('{b}', analysis.worstPair.b),
    },
    source: 'fallback',
  };
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/lib/fallback.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib && git commit -m "feat: 폴백 해설 템플릿"
```

---

### Task 10: 추천 오케스트레이션 + API 라우트

**Files:**
- Create: `src/lib/recommend.ts`, `src/app/api/recommend/route.ts`, `.env.local`
- Test: `src/lib/recommend.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성 — Create `src/lib/recommend.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { buildRecommendation } from './recommend';
import { scoreFoods } from './scoring';
import { FOODS } from './foods';
import { analyzeTeam } from './saju';

const members = [
  { name: '철수', birthDate: '1993-05-14', birthHour: 12 },
  { name: '영희', birthDate: '1996-11-02', birthHour: null },
];
const analysis = analyzeTeam('팀', members, new Date(2026, 5, 11));
const candidates = scoreFoods(analysis, FOODS, 'seed').slice(0, 8);

describe('buildRecommendation', () => {
  it('LLM이 유효한 JSON을 주면 source=llm', async () => {
    const llmJson = JSON.stringify({
      top3: candidates.slice(0, 3).map((c) => ({ id: c.id, comment: '드립' })),
      summary: '총평',
      pairComment: { best: 'b', worst: 'w' },
    });
    const r = await buildRecommendation(analysis, candidates, async () => llmJson, 'seed');
    expect(r.source).toBe('llm');
    expect(r.top3[0].name).toBe(candidates[0].name); // id→음식 정보 매핑 확인
  });
  it('LLM 호출 실패 시 폴백', async () => {
    const r = await buildRecommendation(
      analysis, candidates, async () => { throw new Error('down'); }, 'seed',
    );
    expect(r.source).toBe('fallback');
    expect(r.top3).toHaveLength(3);
  });
  it('LLM이 깨진 JSON을 주면 폴백', async () => {
    const r = await buildRecommendation(analysis, candidates, async () => 'not json', 'seed');
    expect(r.source).toBe('fallback');
  });
  it('LLM이 없는 음식 id를 주면 폴백', async () => {
    const bad = JSON.stringify({
      top3: [{ id: 'ghost-food', comment: 'x' }], summary: 's',
      pairComment: { best: 'b', worst: 'w' },
    });
    const r = await buildRecommendation(analysis, candidates, async () => bad, 'seed');
    expect(r.source).toBe('fallback');
  });
  it('타임아웃 시 폴백', async () => {
    const slow = () => new Promise<string>((res) => setTimeout(() => res('{}'), 50));
    const r = await buildRecommendation(analysis, candidates, slow, 'seed', 10);
    expect(r.source).toBe('fallback');
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/lib/recommend.test.ts`
Expected: FAIL — "Cannot find module './recommend'"

- [ ] **Step 3: 구현 — Create `src/lib/recommend.ts`**

```ts
import type { RecommendResult, ScoredFood, TeamAnalysis } from './saju/types';
import { ELEMENT_LABEL } from './saju/types';
import { buildFallback } from './fallback';

type Generate = (prompt: string) => Promise<string>;

export function buildPrompt(analysis: TeamAnalysis, candidates: ScoredFood[]): string {
  const pct = Object.entries(analysis.teamPct)
    .map(([k, v]) => `${ELEMENT_LABEL[k as keyof typeof ELEMENT_LABEL]} ${v}%`).join(', ');
  return [
    `팀 이름: ${analysis.teamName}`,
    `멤버: ${analysis.members.map((m) => m.name).join(', ')}`,
    `팀 오행 분포(오늘 일진 ${analysis.iljin.ganZhi} 반영): ${pct}`,
    `과다: ${analysis.excess.map((k) => ELEMENT_LABEL[k]).join(', ') || '없음'} / 부족: ${analysis.lacking.map((k) => ELEMENT_LABEL[k]).join(', ') || '없음'}`,
    `최고 궁합: ${analysis.bestPair.a} & ${analysis.bestPair.b} / 최악 궁합: ${analysis.worstPair.a} & ${analysis.worstPair.b}`,
    `메뉴 후보(점수순): ${candidates.map((c) => `${c.id}(${c.name})`).join(', ')}`,
    '',
    '위 후보 중 3개를 골라 순위를 매기고, 아래 JSON 형식으로만 응답하라.',
    '{"top3":[{"id":"<후보 id>","comment":"<메뉴별 추천 드립 1문장>"}],"summary":"<팀 총평 2문장, 밈 톤>","pairComment":{"best":"<최고 궁합 드립 1문장>","worst":"<최악 궁합 드립 1문장>"}}',
  ].join('\n');
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error('timeout')), ms)),
  ]);
}

function parseLlm(raw: string, candidates: ScoredFood[]): Omit<RecommendResult, 'source'> | null {
  try {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const j = JSON.parse(cleaned);
    if (!Array.isArray(j.top3) || j.top3.length < 3) return null;
    const top3 = j.top3.slice(0, 3).map((t: { id: string; comment: string }) => {
      const food = candidates.find((c) => c.id === t.id);
      if (!food || typeof t.comment !== 'string') throw new Error('invalid id');
      return { id: food.id, name: food.name, emoji: food.emoji, comment: t.comment };
    });
    if (typeof j.summary !== 'string' || !j.pairComment?.best || !j.pairComment?.worst) return null;
    return { top3, summary: j.summary, pairComment: j.pairComment };
  } catch {
    return null;
  }
}

export async function buildRecommendation(
  analysis: TeamAnalysis,
  candidates: ScoredFood[],
  generate: Generate,
  seed: string,
  timeoutMs = 8000,
): Promise<RecommendResult> {
  try {
    const raw = await withTimeout(generate(buildPrompt(analysis, candidates)), timeoutMs);
    const parsed = parseLlm(raw, candidates);
    if (parsed) return { ...parsed, source: 'llm' };
  } catch {
    // 폴백으로 진행
  }
  return buildFallback(analysis, candidates, seed);
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/lib/recommend.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: API 라우트 — Create `src/app/api/recommend/route.ts`**

```ts
import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { buildRecommendation } from '@/lib/recommend';
import { buildFallback } from '@/lib/fallback';
import type { ScoredFood, TeamAnalysis } from '@/lib/saju/types';

const SYSTEM_PROMPT =
  '너는 사주 기반 점심 추천 서비스 "점심팔자"의 해설가다. ' +
  '명리학 용어(오행, 상생상극, 일진)를 근거로 쓰되, 말투는 한국 직장인 단톡방 밈 톤으로 가볍고 웃기게. ' +
  '과장된 수치("언쟁 위험 200%")와 구체적 상황 묘사를 활용하라. 반드시 요청된 JSON 형식으로만 응답한다.';

const client = new Anthropic(); // ANTHROPIC_API_KEY 환경변수 사용

async function generate(prompt: string): Promise<string> {
  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001', // 빠른 응답 우선 (8초 타임아웃 내 안정권)
    max_tokens: 1024,
    system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: prompt }],
  });
  const block = msg.content[0];
  if (block.type !== 'text') throw new Error('unexpected response');
  return block.text;
}

interface Body { analysis: TeamAnalysis; candidates: ScoredFood[]; seed: string; }

function isValidBody(b: unknown): b is Body {
  const x = b as Body;
  return !!x && !!x.analysis?.teamPct && Array.isArray(x.candidates)
    && x.candidates.length >= 3 && typeof x.seed === 'string';
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식' }, { status: 400 });
  }
  if (!isValidBody(body)) {
    return NextResponse.json({ error: '필수 필드 누락' }, { status: 400 });
  }
  try {
    const result = await buildRecommendation(body.analysis, body.candidates, generate, body.seed);
    return NextResponse.json(result);
  } catch {
    // buildRecommendation 내부에서 폴백하지만, 만약의 경우까지 방어
    return NextResponse.json(buildFallback(body.analysis, body.candidates, body.seed));
  }
}
```

- [ ] **Step 6: 환경변수 — Create `.env.local`** (gitignore에 이미 포함됨)

```
ANTHROPIC_API_KEY=<발급받은 키>
```

- [ ] **Step 7: 수동 확인**

Run: `npm run dev` 후 별도 터미널에서:
```bash
curl -s -X POST localhost:3000/api/recommend -H 'Content-Type: application/json' -d '{"analysis":null,"candidates":[],"seed":"x"}'
```
Expected: `{"error":"필수 필드 누락"}` (400)

- [ ] **Step 8: Commit** (.env.local은 커밋 금지 — gitignore 확인)

```bash
git add src/lib/recommend.ts src/lib/recommend.test.ts src/app/api && git commit -m "feat: 추천 오케스트레이션 및 /api/recommend (Claude + 폴백)"
```

---

### Task 11: 디자인 토큰 + 다크 네온 베이스

**Files:**
- Modify: `src/app/globals.css`, `src/app/layout.tsx`

- [ ] **Step 1: 디자인 토큰 — `src/app/globals.css` 전체 교체**

```css
@import "tailwindcss";

@theme {
  /* 배경 */
  --color-night: #0a0a1a;
  --color-night-soft: #141432;
  --color-card: #1a1a3e;
  /* 오행 네온 */
  --color-el-wood: #6ee7a0;
  --color-el-fire: #ff7a5c;
  --color-el-earth: #f0b86e;
  --color-el-metal: #d6e0f5;
  --color-el-water: #5ab8ff;
  /* 텍스트 */
  --color-ink: #eef0ff;
  --color-ink-dim: #9aa3cc;
  --color-accent: #b18cff;
}

body {
  background: radial-gradient(ellipse 80% 60% at 50% 0%, #1c1448 0%, var(--color-night) 60%);
  color: var(--color-ink);
  min-height: 100vh;
}

.glow-card {
  background: color-mix(in srgb, var(--color-card) 80%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-accent) 25%, transparent);
  border-radius: 1rem;
  box-shadow: 0 0 24px rgba(120, 100, 255, 0.12);
}

.neon-text {
  text-shadow: 0 0 16px rgba(140, 150, 255, 0.7);
}
```

- [ ] **Step 2: 레이아웃 — `src/app/layout.tsx` 전체 교체**

```tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '점심팔자 — 오늘 우리 팀 점심, 사주에게 물어봐',
  description: '팀원들의 사주 궁합과 오늘의 일진으로 점심 메뉴를 추천해드립니다.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="antialiased">
        <main className="mx-auto max-w-md px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: 빌드 확인**

Run: `npm run build`
Expected: 성공

- [ ] **Step 4: Commit**

```bash
git add src/app && git commit -m "feat: 다크 네온 디자인 토큰 및 베이스 레이아웃"
```

---

### Task 12: 오행 캐릭터 SVG

**Files:**
- Create: `src/components/ElementCharacter.tsx`

- [ ] **Step 1: 구현 — Create `src/components/ElementCharacter.tsx`**

눈·입·팔다리가 있는 꼬마 블롭 캐릭터. 오행별 색상 + 머리 장식만 다르고 골격은 공유.

```tsx
import type { ElementKey } from '@/lib/saju/types';

const PALETTE: Record<ElementKey, { main: string; dark: string; glow: string }> = {
  fire:  { main: '#ffd34d', dark: '#e8356e', glow: 'rgba(255,120,60,0.55)' },
  water: { main: '#d8f4ff', dark: '#1c63d6', glow: 'rgba(80,170,255,0.5)' },
  wood:  { main: '#d2ff9e', dark: '#2e8f4e', glow: 'rgba(110,210,110,0.45)' },
  metal: { main: '#ffffff', dark: '#8e9cc0', glow: 'rgba(190,205,235,0.5)' },
  earth: { main: '#ffd9a3', dark: '#9c6b35', glow: 'rgba(220,170,100,0.45)' },
};

export function ElementCharacter({ element, size = 96 }: { element: ElementKey; size?: number }) {
  const p = PALETTE[element];
  const gid = `grad-${element}`;
  return (
    <svg width={size} height={size * 1.15} viewBox="0 0 100 115" aria-label={element}>
      <defs>
        <radialGradient id={gid} cx="50%" cy="68%" r="75%">
          <stop offset="0%" stopColor={p.main} />
          <stop offset="100%" stopColor={p.dark} />
        </radialGradient>
      </defs>
      {/* 팔 */}
      <ellipse cx="11" cy="64" rx="13" ry="5.5" fill={p.dark} transform="rotate(26 11 64)" />
      <ellipse cx="89" cy="64" rx="13" ry="5.5" fill={p.dark} transform="rotate(-26 89 64)" />
      {/* 다리 */}
      <rect x="31" y="90" width="10" height="18" rx="5" fill={p.dark} />
      <rect x="59" y="90" width="10" height="18" rx="5" fill={p.dark} />
      {/* 몸통 블롭 */}
      <path
        d="M50 8 C74 10 87 30 85 53 C83 78 69 94 50 94 C31 94 17 78 15 53 C13 30 26 10 50 8 Z"
        fill={`url(#${gid})`}
        style={{ filter: `drop-shadow(0 0 14px ${p.glow})` }}
      />
      {/* 머리 장식 */}
      {element === 'fire' && (
        <path d="M50 0 C58 8 56 16 50 20 C44 16 42 8 50 0 Z" fill={p.main} />
      )}
      {element === 'wood' && (
        <path d="M50 10 C60 -2 72 2 70 12 C62 18 52 16 50 10 Z" fill="#3da45c" />
      )}
      {element === 'earth' && (
        <path d="M58 6 C64 -2 72 2 68 10 C63 13 58 11 58 6 Z" fill="#6ee7a0" />
      )}
      {(element === 'metal' || element === 'water') && (
        <ellipse cx="34" cy="24" rx="11" ry="5" fill="#fff"
          opacity={element === 'metal' ? 0.85 : 0.6} transform="rotate(-20 34 24)" />
      )}
      {/* 눈 */}
      <ellipse cx="40" cy="52" rx="7" ry="8" fill="#fff" />
      <ellipse cx="60" cy="52" rx="7" ry="8" fill="#fff" />
      <circle cx="41" cy="54" r="3.4" fill="#141428" />
      <circle cx="61" cy="54" r="3.4" fill="#141428" />
      {/* 입 */}
      <path d="M44 66 Q50 72 56 66" stroke="#2a1530" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}
```

- [ ] **Step 2: 수동 확인**

`src/app/page.tsx`에 임시로 5종 렌더링 후 `npm run dev`로 확인 (다음 태스크에서 교체되므로 대충):
캐릭터 5종이 각자 색·장식으로 표시되고 눈/입/팔다리가 보이면 OK.

- [ ] **Step 3: Commit**

```bash
git add src/components && git commit -m "feat: 오행 캐릭터 SVG 5종"
```

---

### Task 13: 팀 저장 (localStorage)

**Files:**
- Create: `src/lib/storage.ts`
- Test: `src/lib/storage.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성 — Create `src/lib/storage.test.ts`**

Storage를 주입 가능하게 설계해 node 환경에서 인메모리 목으로 테스트한다.

```ts
import { describe, it, expect } from 'vitest';
import { saveTeam, loadTeams } from './storage';

function memStorage(): Storage {
  const m = new Map<string, string>();
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => void m.set(k, v),
    removeItem: (k) => void m.delete(k),
    clear: () => m.clear(),
    key: () => null,
    get length() { return m.size; },
  } as Storage;
}

const team = {
  teamName: '개발1팀',
  members: [
    { name: '철수', birthDate: '1993-05-14', birthHour: 12 },
    { name: '영희', birthDate: '1996-11-02', birthHour: null },
  ],
};

describe('팀 저장', () => {
  it('저장 후 불러올 수 있다', () => {
    const s = memStorage();
    saveTeam(team, s);
    expect(loadTeams(s)).toEqual([team]);
  });
  it('같은 팀 이름은 덮어쓴다', () => {
    const s = memStorage();
    saveTeam(team, s);
    saveTeam({ ...team, members: team.members.slice(0, 2) }, s);
    expect(loadTeams(s)).toHaveLength(1);
  });
  it('깨진 데이터면 빈 배열', () => {
    const s = memStorage();
    s.setItem('lunchton.teams', '{{{');
    expect(loadTeams(s)).toEqual([]);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/lib/storage.test.ts`
Expected: FAIL — "Cannot find module './storage'"

- [ ] **Step 3: 구현 — Create `src/lib/storage.ts`**

```ts
import type { MemberInput } from './saju/types';

export interface SavedTeam { teamName: string; members: MemberInput[]; }

const KEY = 'lunchton.teams';

function defaultStorage(): Storage | null {
  return typeof window === 'undefined' ? null : window.localStorage;
}

export function loadTeams(storage: Storage | null = defaultStorage()): SavedTeam[] {
  if (!storage) return [];
  try {
    const raw = storage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveTeam(team: SavedTeam, storage: Storage | null = defaultStorage()): void {
  if (!storage) return;
  const teams = loadTeams(storage).filter((t) => t.teamName !== team.teamName);
  teams.unshift(team);
  storage.setItem(KEY, JSON.stringify(teams.slice(0, 10))); // 최대 10팀
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/lib/storage.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib && git commit -m "feat: 팀 저장/불러오기 (localStorage)"
```

---

### Task 14: 입력 화면 (TeamForm)

**Files:**
- Create: `src/components/TeamForm.tsx`

UI는 수동 검증(스펙의 테스트 전략). 검증 규칙: 팀 이름 필수, 멤버 2~8명, 이름 필수, 생년월일 1900-01-01~오늘.

- [ ] **Step 1: 구현 — Create `src/components/TeamForm.tsx`**

```tsx
'use client';

import { useState } from 'react';
import type { MemberInput } from '@/lib/saju/types';
import { ELEMENT_KEYS } from '@/lib/saju/types';
import { loadTeams, type SavedTeam } from '@/lib/storage';
import { ElementCharacter } from './ElementCharacter';

interface Props { onSubmit: (teamName: string, members: MemberInput[]) => void; }

const EMPTY: MemberInput = { name: '', birthDate: '', birthHour: null };

function validate(teamName: string, members: MemberInput[]): string | null {
  if (!teamName.trim()) return '팀 이름을 입력해주세요';
  if (members.length < 2) return '멤버는 2명 이상이어야 해요';
  for (const m of members) {
    if (!m.name.trim()) return '이름이 비어있는 멤버가 있어요';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(m.birthDate)) return `${m.name}의 생년월일을 확인해주세요`;
    const d = new Date(m.birthDate);
    if (d < new Date('1900-01-01') || d > new Date()) return `${m.name}의 생년월일 범위가 이상해요`;
  }
  return null;
}

export function TeamForm({ onSubmit }: Props) {
  const [teamName, setTeamName] = useState('');
  const [members, setMembers] = useState<MemberInput[]>([{ ...EMPTY }, { ...EMPTY }]);
  const [error, setError] = useState<string | null>(null);
  const [saved] = useState<SavedTeam[]>(() => loadTeams());

  function updateMember(i: number, patch: Partial<MemberInput>) {
    setMembers((prev) => prev.map((m, j) => (j === i ? { ...m, ...patch } : m)));
  }

  function handleSubmit() {
    const err = validate(teamName, members);
    if (err) { setError(err); return; }
    onSubmit(teamName.trim(), members);
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="text-center">
        <div className="flex justify-center gap-1">
          {ELEMENT_KEYS.map((el) => <ElementCharacter key={el} element={el} size={44} />)}
        </div>
        <h1 className="neon-text mt-3 text-3xl font-extrabold">🍚 점심팔자</h1>
        <p className="mt-1 text-sm text-ink-dim">오늘 우리 팀 점심, 사주에게 물어봐</p>
      </header>

      {saved.length > 0 && (
        <div className="glow-card p-3">
          <p className="mb-2 text-xs text-ink-dim">저장된 팀 불러오기</p>
          <div className="flex flex-wrap gap-2">
            {saved.map((t) => (
              <button key={t.teamName}
                className="rounded-full border border-accent/40 px-3 py-1 text-sm"
                onClick={() => { setTeamName(t.teamName); setMembers(t.members); }}>
                {t.teamName} ({t.members.length}명)
              </button>
            ))}
          </div>
        </div>
      )}

      <input
        className="glow-card w-full px-4 py-3"
        placeholder="팀 이름 (예: 개발1팀 점심원정대)"
        value={teamName}
        onChange={(e) => setTeamName(e.target.value)}
      />

      {members.map((m, i) => (
        <div key={i} className="glow-card flex flex-col gap-2 p-3">
          <div className="flex items-center gap-2">
            <input
              className="flex-1 rounded-lg bg-night-soft px-3 py-2"
              placeholder={`멤버 ${i + 1} 이름`}
              value={m.name}
              onChange={(e) => updateMember(i, { name: e.target.value })}
            />
            {members.length > 2 && (
              <button className="text-ink-dim" aria-label="멤버 삭제"
                onClick={() => setMembers((prev) => prev.filter((_, j) => j !== i))}>✕</button>
            )}
          </div>
          <div className="flex gap-2">
            <input type="date" className="flex-1 rounded-lg bg-night-soft px-3 py-2"
              value={m.birthDate}
              onChange={(e) => updateMember(i, { birthDate: e.target.value })} />
            <select className="rounded-lg bg-night-soft px-2 py-2"
              value={m.birthHour ?? ''}
              onChange={(e) => updateMember(i, {
                birthHour: e.target.value === '' ? null : Number(e.target.value),
              })}>
              <option value="">시간 모름</option>
              {Array.from({ length: 24 }, (_, h) => (
                <option key={h} value={h}>{h}시</option>
              ))}
            </select>
          </div>
        </div>
      ))}

      {members.length < 8 && (
        <button className="glow-card py-2 text-ink-dim"
          onClick={() => setMembers((prev) => [...prev, { ...EMPTY }])}>
          ＋ 멤버 추가
        </button>
      )}

      {error && <p className="text-center text-sm text-el-fire">{error}</p>}

      <button
        className="rounded-xl bg-accent py-4 text-lg font-bold text-night neon-text"
        onClick={handleSubmit}>
        오늘의 점심 운세 보기 🔮
      </button>
      <p className="text-center text-xs text-ink-dim">태어난 시간은 몰라도 OK</p>
    </div>
  );
}
```

- [ ] **Step 2: 수동 확인**

`npm run dev` → 멤버 추가/삭제, 검증 에러 메시지(빈 이름, 1명 제출), 시간 모름 선택 동작 확인.

- [ ] **Step 3: Commit**

```bash
git add src/components && git commit -m "feat: 팀 입력 폼"
```

---

### Task 15: 룰렛 컴포넌트

**Files:**
- Create: `src/components/Roulette.tsx`

동작: 후보 8개로 휠 구성 → 마운트 시 무한 회전 → `winnerIndex`가 도착하면 해당 칸이 상단 포인터에 오도록 감속 정지 → `onDone` 호출.

- [ ] **Step 1: 구현 — Create `src/components/Roulette.tsx`**

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import type { ScoredFood, ElementKey } from '@/lib/saju/types';
import { ELEMENT_CHARACTER, ELEMENT_LABEL } from '@/lib/saju/types';
import { ElementCharacter } from './ElementCharacter';

const SEGMENT_COLORS: Record<ElementKey, string> = {
  wood: '#2e6b4a', fire: '#7a2e3e', earth: '#6b542e', metal: '#4a5570', water: '#2e4a7a',
};

interface Props {
  items: ScoredFood[];          // 8개
  winnerIndex: number | null;   // API 응답 도착 시 설정
  spinMessages: string[];       // 오행 멘트 (계산 결과 기반)
  onDone: () => void;
}

export function Roulette({ items, winnerIndex, spinMessages, onDone }: Props) {
  const [deg, setDeg] = useState(0);
  const [stopping, setStopping] = useState(false);
  const [msgIdx, setMsgIdx] = useState(0);
  const rafRef = useRef(0);
  const degRef = useRef(0);
  const seg = 360 / items.length;

  // 무한 회전 (winner 도착 전)
  useEffect(() => {
    if (stopping) return;
    const tick = () => {
      degRef.current = (degRef.current + 6) % 360000;
      setDeg(degRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [stopping]);

  // 멘트 로테이션
  useEffect(() => {
    const t = setInterval(() => setMsgIdx((i) => (i + 1) % spinMessages.length), 1500);
    return () => clearInterval(t);
  }, [spinMessages.length]);

  // winner 도착 → 감속 정지 (최소 1.5초는 돌고 나서)
  useEffect(() => {
    if (winnerIndex === null) return;
    const minSpin = setTimeout(() => {
      cancelAnimationFrame(rafRef.current);
      // 포인터(상단 0도)에 winner 칸 중심이 오도록: 현재 각도에서 +2바퀴 이상 더 회전
      const targetMod = (360 - (winnerIndex * seg + seg / 2)) % 360;
      const current = degRef.current % 360;
      const delta = ((targetMod - current) % 360 + 360) % 360 + 720;
      setStopping(true);
      setDeg(degRef.current + delta);
    }, 1500);
    return () => clearTimeout(minSpin);
  }, [winnerIndex, seg]);

  const gradient = items
    .map((f, i) => `${SEGMENT_COLORS[f.elements[0]]} ${i * seg}deg ${(i + 1) * seg}deg`)
    .join(', ');

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <div className="relative">
        <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 text-2xl">🔻</div>
        <div
          className="relative h-72 w-72 rounded-full border-4 border-accent/60"
          style={{
            background: `conic-gradient(${gradient})`,
            transform: `rotate(${deg}deg)`,
            transition: stopping ? 'transform 2.5s cubic-bezier(0.15, 0.85, 0.25, 1)' : 'none',
            boxShadow: '0 0 40px rgba(120,100,255,0.35)',
          }}
          onTransitionEnd={onDone}
        >
          {items.map((f, i) => {
            const angle = i * seg + seg / 2;
            return (
              <div key={f.id}
                className="absolute left-1/2 top-1/2 text-center text-[11px] font-bold"
                style={{
                  transform: `rotate(${angle}deg) translateY(-108px) rotate(0deg)`,
                  transformOrigin: '0 0',
                }}>
                <div className="text-xl">{f.emoji}</div>
                <div className="-ml-6 w-12">{f.name}</div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex items-end gap-2">
        <ElementCharacter element="fire" size={40} />
        <ElementCharacter element="water" size={40} />
      </div>
      <p className="neon-text min-h-6 text-center text-sm text-ink-dim">
        {spinMessages[msgIdx] ?? '팀의 기운을 읽는 중...'}
      </p>
    </div>
  );
}

export function buildSpinMessages(excess: ElementKey[], lacking: ElementKey[]): string[] {
  const msgs = ['팀의 기운을 읽는 중...', '오늘의 일진을 확인하는 중...'];
  for (const e of excess) msgs.push(`${ELEMENT_LABEL[e]} 기운이 심상치 않습니다... ${ELEMENT_CHARACTER[e]} 과다 감지!`);
  for (const l of lacking) msgs.push(`${ELEMENT_CHARACTER[l]}이(가) 부족해요... ${ELEMENT_LABEL[l]} 충전이 필요합니다`);
  return msgs;
}
```

- [ ] **Step 2: 수동 확인**

다음 태스크에서 페이지에 연결 후: 룰렛이 돌다가 1위 메뉴 칸이 포인터 위치에서 멈추는지, 멘트가 1.5초마다 바뀌는지 확인.

- [ ] **Step 3: Commit**

```bash
git add src/components && git commit -m "feat: 룰렛 컴포넌트 (1위 메뉴에 정지)"
```

---

### Task 16: 결과 화면 (차트 + 페어 + 조립)

**Files:**
- Create: `src/components/ElementChart.tsx`, `src/components/PairCard.tsx`, `src/components/ResultView.tsx`

- [ ] **Step 1: 도넛 차트 — Create `src/components/ElementChart.tsx`**

```tsx
'use client';

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import type { ElementKey, TeamAnalysis } from '@/lib/saju/types';
import { ELEMENT_KEYS, ELEMENT_LABEL, ELEMENT_CHARACTER } from '@/lib/saju/types';
import { ElementCharacter } from './ElementCharacter';

const CHART_COLORS: Record<ElementKey, string> = {
  wood: '#6ee7a0', fire: '#ff7a5c', earth: '#f0b86e', metal: '#d6e0f5', water: '#5ab8ff',
};

export function ElementChart({ analysis }: { analysis: TeamAnalysis }) {
  const data = ELEMENT_KEYS
    .map((k) => ({ key: k, name: ELEMENT_LABEL[k], value: analysis.teamPct[k] }))
    .filter((d) => d.value > 0);
  const main = analysis.excess[0] ?? null;

  return (
    <div className="glow-card p-4">
      <p className="mb-2 text-xs uppercase tracking-widest text-ink-dim">팀 오행 분포</p>
      <div className="flex items-center gap-3">
        <div className="h-36 w-36 shrink-0">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={data} dataKey="value" innerRadius={40} outerRadius={64}
                strokeWidth={0} isAnimationActive>
                {data.map((d) => <Cell key={d.key} fill={CHART_COLORS[d.key]} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 text-sm">
          {main && (
            <div className="mb-1 flex items-center gap-2">
              <ElementCharacter element={main} size={36} />
              <span>
                <b style={{ color: CHART_COLORS[main] }}>
                  {ELEMENT_LABEL[main]} {analysis.teamPct[main]}%
                </b> — {ELEMENT_CHARACTER[main]} 과다!
              </span>
            </div>
          )}
          {analysis.lacking.length > 0 && (
            <p className="text-ink-dim">
              부족: {analysis.lacking.map((k) => ELEMENT_LABEL[k]).join(', ')}
            </p>
          )}
          <ul className="mt-2 space-y-0.5 text-xs text-ink-dim">
            {data.map((d) => (
              <li key={d.key}>
                <span style={{ color: CHART_COLORS[d.key] }}>●</span> {d.name} {d.value}%
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 페어 카드 — Create `src/components/PairCard.tsx`**

```tsx
import type { RecommendResult, TeamAnalysis } from '@/lib/saju/types';

export function PairCard({ analysis, reco }: { analysis: TeamAnalysis; reco: RecommendResult }) {
  return (
    <div className="glow-card p-4">
      <p className="mb-2 text-xs uppercase tracking-widest text-ink-dim">오늘의 궁합 페어</p>
      <div className="space-y-2 text-sm">
        <p>
          💕 <b>{analysis.bestPair.a} ♥ {analysis.bestPair.b}</b>
          <span className="block text-xs text-ink-dim">{reco.pairComment.best}</span>
        </p>
        <p>
          ⚡ <b>{analysis.worstPair.a} ↔ {analysis.worstPair.b}</b>
          <span className="block text-xs text-ink-dim">{reco.pairComment.worst}</span>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 결과 조립 — Create `src/components/ResultView.tsx`**

```tsx
'use client';

import type { RecommendResult, TeamAnalysis } from '@/lib/saju/types';
import { ElementChart } from './ElementChart';
import { PairCard } from './PairCard';

interface Props {
  analysis: TeamAnalysis;
  reco: RecommendResult;
  onRedraw: () => void;
  onSave: () => void;
  saved: boolean;
  today: string; // 'YYYY년 M월 D일'
}

export function ResultView({ analysis, reco, onRedraw, onSave, saved, today }: Props) {
  const [first, ...rest] = reco.top3;
  return (
    <div className="flex flex-col gap-4">
      <header className="text-center">
        <p className="text-xs tracking-widest text-ink-dim">
          {today} · {analysis.iljin.ganZhi}일
        </p>
        <h2 className="neon-text mt-2 text-3xl font-extrabold">
          오늘의 추천 {first.emoji} {first.name}
        </h2>
        <p className="mx-auto mt-3 max-w-sm text-sm text-ink-dim">{first.comment}</p>
        <p className="mx-auto mt-2 max-w-sm text-sm">{reco.summary}</p>
      </header>

      <div className="flex justify-center gap-2">
        {rest.map((f, i) => (
          <div key={f.id} className="glow-card px-3 py-2 text-center text-sm">
            <span className="text-xs text-ink-dim">{i === 0 ? '🥈' : '🥉'}</span>{' '}
            {f.emoji} {f.name}
            <p className="mt-0.5 max-w-40 text-xs text-ink-dim">{f.comment}</p>
          </div>
        ))}
      </div>

      <ElementChart analysis={analysis} />
      <PairCard analysis={analysis} reco={reco} />

      <div className="flex gap-2">
        <button className="flex-1 rounded-xl bg-accent py-3 font-bold text-night" onClick={onRedraw}>
          다시 뽑기 🎲
        </button>
        <button className="glow-card flex-1 py-3 font-bold" onClick={onSave} disabled={saved}>
          {saved ? '저장됨 ✅' : '팀 저장 💾'}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 빌드 확인**

Run: `npm run build`
Expected: 성공 (페이지 연결 전이므로 미사용 경고는 무시)

- [ ] **Step 5: Commit**

```bash
git add src/components && git commit -m "feat: 결과 화면 (오행 차트, 페어 카드, 조립)"
```

---

### Task 17: 페이지 상태머신 연결 (input → spin → result)

**Files:**
- Create: `src/lib/recommend-client.ts`
- Modify: `src/app/page.tsx` 전체 교체

- [ ] **Step 1: 클라이언트 fetch 헬퍼 — Create `src/lib/recommend-client.ts`**

```ts
import type { RecommendResult, ScoredFood, TeamAnalysis } from './saju/types';
import { buildFallback } from './fallback';

// fetch 실패(네트워크/5xx)면 클라이언트에서 직접 폴백 — 데모는 절대 죽지 않는다
export async function fetchRecommendation(
  analysis: TeamAnalysis,
  candidates: ScoredFood[],
  seed: string,
): Promise<RecommendResult> {
  try {
    const res = await fetch('/api/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ analysis, candidates, seed }),
    });
    if (!res.ok) throw new Error(`status ${res.status}`);
    return (await res.json()) as RecommendResult;
  } catch {
    return buildFallback(analysis, candidates, seed);
  }
}
```

- [ ] **Step 2: 페이지 — `src/app/page.tsx` 전체 교체**

```tsx
'use client';

import { useState } from 'react';
import type { MemberInput, RecommendResult, ScoredFood, TeamAnalysis } from '@/lib/saju/types';
import { analyzeTeam } from '@/lib/saju';
import { FOODS } from '@/lib/foods';
import { scoreFoods } from '@/lib/scoring';
import { fetchRecommendation } from '@/lib/recommend-client';
import { saveTeam } from '@/lib/storage';
import { TeamForm } from '@/components/TeamForm';
import { Roulette, buildSpinMessages } from '@/components/Roulette';
import { ResultView } from '@/components/ResultView';

type Phase = 'input' | 'spin' | 'result';

export default function Home() {
  const [phase, setPhase] = useState<Phase>('input');
  const [analysis, setAnalysis] = useState<TeamAnalysis | null>(null);
  const [candidates, setCandidates] = useState<ScoredFood[]>([]);
  const [reco, setReco] = useState<RecommendResult | null>(null);
  const [winnerIndex, setWinnerIndex] = useState<number | null>(null);
  const [members, setMembers] = useState<MemberInput[]>([]);
  const [saved, setSaved] = useState(false);
  const [excludeIds, setExcludeIds] = useState<string[]>([]);

  const today = new Date();
  const todayLabel = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;

  async function run(teamName: string, memberInputs: MemberInput[], exclude: string[]) {
    const a = analyzeTeam(teamName, memberInputs, today);
    const seed = `${teamName}|${today.toDateString()}|${exclude.length}`;
    const cands = scoreFoods(a, FOODS, seed, exclude).slice(0, 8);
    setAnalysis(a);
    setCandidates(cands);
    setMembers(memberInputs);
    setWinnerIndex(null);
    setReco(null);
    setSaved(false);
    setPhase('spin');

    const r = await fetchRecommendation(a, cands, seed);
    setReco(r);
    const idx = cands.findIndex((c) => c.id === r.top3[0].id);
    setWinnerIndex(idx >= 0 ? idx : 0);
  }

  function handleRedraw() {
    if (!analysis || !reco) return;
    const newExclude = [...excludeIds, ...reco.top3.map((t) => t.id)];
    setExcludeIds(newExclude);
    run(analysis.teamName, members, newExclude);
  }

  function handleSave() {
    if (!analysis) return;
    saveTeam({ teamName: analysis.teamName, members });
    setSaved(true);
  }

  return (
    <>
      {phase === 'input' && (
        <TeamForm onSubmit={(name, m) => { setExcludeIds([]); run(name, m, []); }} />
      )}
      {phase === 'spin' && analysis && (
        <Roulette
          items={candidates}
          winnerIndex={winnerIndex}
          spinMessages={buildSpinMessages(analysis.excess, analysis.lacking)}
          onDone={() => setPhase('result')}
        />
      )}
      {phase === 'result' && analysis && reco && (
        <ResultView
          analysis={analysis} reco={reco} today={todayLabel}
          onRedraw={handleRedraw} onSave={handleSave} saved={saved}
        />
      )}
    </>
  );
}
```

- [ ] **Step 3: E2E 수동 검증 (핵심 시나리오)**

`npm run dev` 후:
1. 멤버 3명 입력 → 제출 → 룰렛이 돌다가 1위 메뉴에 멈춤 → 결과 화면 표시
2. 결과: 1~3위 메뉴 + 해설, 도넛 차트, 페어 카드 모두 렌더링
3. "다시 뽑기" → 이전 1~3위가 후보에서 제외되고 새 결과
4. "팀 저장" → 새로고침 → 입력 화면에 저장된 팀 칩 → 클릭 시 폼 채워짐
5. `.env.local`의 API 키를 잠깐 깨뜨리고 → 폴백 해설로도 정상 동작 확인 (복구 필수)

- [ ] **Step 4: 전체 테스트 + 빌드**

Run: `npx vitest run && npm run build`
Expected: 전부 PASS, 빌드 성공

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: 입력→룰렛→결과 상태머신 연결"
```

---

### Task 18: 배포 + 데모 리허설

**Files:** 없음 (배포 설정만)

- [ ] **Step 1: Vercel 배포**

```bash
npx vercel --prod
```
또는 GitHub 연결 후 Vercel 대시보드에서 import. **환경변수 `ANTHROPIC_API_KEY`를 Vercel 프로젝트 설정에 등록**(Production).

- [ ] **Step 2: 프로덕션 스모크 테스트**

배포 URL에서 Task 17 Step 3의 시나리오 1, 2번을 재확인. 특히 API 라우트가 프로덕션에서 LLM 응답(`source: 'llm'`)을 주는지 결과 응답을 브라우저 네트워크 탭에서 확인.

- [ ] **Step 3: 데모 리허설 체크리스트**

- [ ] 시연용 팀 데이터 준비 (멤버 4명, 실명 대신 재미있는 가명)
- [ ] 룰렛 멈춤 → 결과 전환이 자연스러운지
- [ ] 폴백 모드 강제 시연 가능 여부 확인 (와이파이 끊고 1회)
- [ ] 모바일 화면(375px) 레이아웃 깨짐 확인

- [ ] **Step 4: Commit + 태그**

```bash
git add -A && git commit -m "chore: 배포 설정 및 데모 준비" && git tag demo-v1
```

---

## 백로그 (시간 남으면)

스펙의 TO-BE — 이 plan 범위 밖:
- 근처 실제 식당 연결 (네이버 지역 검색 링크)
- 링크 공유로 각자 입력하는 방 모드
- 결과 카드 이미지 공유
