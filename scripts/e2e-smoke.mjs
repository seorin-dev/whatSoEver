// 데모 핵심 플로우 E2E 스모크: 입력 → 룰렛 → 결과 → 다시뽑기 → 팀저장/불러오기
// 실행: node scripts/e2e-smoke.mjs (dev 서버가 localhost:3000에 떠 있어야 함)
import { chromium } from 'playwright-core';

const BASE = 'http://localhost:3000';
let failures = 0;
const ok = (name, cond) => {
  console.log(`${cond ? 'PASS' : 'FAIL'} — ${name}`);
  if (!cond) failures += 1;
};

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage();
const consoleErrors = [];
page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text());
});

await page.goto(BASE);
ok('입력 화면: 런치포어스 헤더', await page.getByText('런치포어스').first().isVisible());

// 입력
await page.getByPlaceholder('팀 이름 (예: 개발1팀 점심원정대)').fill('테스트팀');
await page.getByPlaceholder('멤버 1 이름').fill('철수');
await page.getByPlaceholder('멤버 2 이름').fill('영희');
// 연/월/일 분리 입력 (자동 이동) — 연도 칸 클릭 후 한 번에 타이핑
const years = page.getByLabel('출생 연도');
await years.nth(0).click(); await page.keyboard.type('19930514');
await years.nth(1).click(); await page.keyboard.type('19961102');

// 검증 에러 경로: 멤버 1명 이름 비우고 제출
await page.getByPlaceholder('멤버 2 이름').fill('');
await page.getByText('오늘의 점심 운세 보기').click();
ok('검증 에러 표시', await page.getByText('이름이 비어있는 멤버가 있어요').isVisible());
await page.getByPlaceholder('멤버 2 이름').fill('영희');

// 제출 → 룰렛
await page.getByText('오늘의 점심 운세 보기').click();
await page.waitForTimeout(800);
ok('룰렛 화면: 멘트 노출', await page.getByText(/기운|일진/).first().isVisible());

// 결과 대기 (폴백 포함 최대 ~12초: API 8s 타임아웃 + 룰렛 정지 4초)
await page.getByText('오늘의 추천').waitFor({ timeout: 20000 });
ok('결과 화면: 오늘의 추천', true);
ok('결과 화면: 오행 분포 카드', await page.getByText('팀 오행 분포').isVisible());
ok('결과 화면: 궁합 페어 카드', await page.getByText('오늘의 궁합 페어').isVisible());
const firstPick = await page.locator('h2').first().textContent();

// 다른 메뉴 추천 → 새 결과
await page.getByText('다른 메뉴 추천').click();
await page.getByText('오늘의 추천').waitFor({ timeout: 20000 });
const secondPick = await page.locator('h2').first().textContent();
ok(`다시 뽑기: 1위 변경 (${firstPick?.trim()} → ${secondPick?.trim()})`, firstPick !== secondPick);

// 팀 저장 → 새로고침 → 칩 → 폼 채움
await page.getByText('팀 저장').click();
ok('저장됨 표시', await page.getByText('저장됨').isVisible());
await page.goto(BASE);
await page.getByText('테스트팀 (2명)').waitFor({ timeout: 5000 });
ok('저장된 팀 칩 노출', true);
await page.getByText('테스트팀 (2명)').click();
ok('칩 클릭: 팀 이름 채움', (await page.getByPlaceholder('팀 이름 (예: 개발1팀 점심원정대)').inputValue()) === '테스트팀');
ok('칩 클릭: 멤버 이름 채움', (await page.getByPlaceholder('멤버 1 이름').inputValue()) === '철수');

ok(`콘솔 에러 없음 (${consoleErrors.length}건)`, consoleErrors.length === 0);
if (consoleErrors.length) console.log(consoleErrors.slice(0, 5).join('\n'));

await browser.close();
console.log(failures === 0 ? '\nE2E SMOKE: ALL PASS' : `\nE2E SMOKE: ${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
