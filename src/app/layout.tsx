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
