import { Solar } from 'lunar-javascript';
import type { ElementKey, MemberInput, MemberSaju } from './types';
import { emptyDist } from './types';
import { ganToElement, zhiToElement } from './elements';

// 글자 배열 순서: [연간, 연지, 월간, 월지, 일간, 일지, (시간, 시지)]
// 짝수 인덱스 = 천간, 홀수 인덱스 = 지지
export function computeMemberSaju(input: MemberInput): MemberSaju {
  const [y, m, d] = input.birthDate.split('-').map(Number);
  // birthHour=null이면 12시를 자리값으로 사용 — 일주는 00:00~22:59 출생엔 정확하지만
  // 23:00~23:59(자시) 출생자는 하루 밀릴 수 있음 (시주 미사용이어도 라이브러리 입력값은 필요)
  const hour = input.birthHour ?? 12;
  const solar = Solar.fromYmdHms(y, m, d, hour, 0, 0);
  const ec = solar.getLunar().getEightChar();

  const glyphs: string[] = [
    ec.getYearGan(),
    ec.getYearZhi(),
    ec.getMonthGan(),
    ec.getMonthZhi(),
    ec.getDayGan(),
    ec.getDayZhi(),
  ];
  if (input.birthHour !== null) {
    glyphs.push(ec.getTimeGan(), ec.getTimeZhi());
  }

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
