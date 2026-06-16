import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { buildRecommendation } from '@/lib/recommend';
import { buildFallback } from '@/lib/fallback';
import type { ScoredFood, TeamAnalysis } from '@/lib/saju/types';

const SYSTEM_PROMPT =
  '너는 사주 기반 점심 추천 서비스 "점심팔자"의 해설가다. ' +
  '명리학 용어(오행, 상생상극, 일진)를 근거로 쓰되, 말투는 한국 직장인 단톡방 밈 톤으로 가볍고 웃기게. ' +
  '과장된 수치("언쟁 위험 200%")와 구체적 상황 묘사를 활용하라. 반드시 요청된 JSON 형식으로만 응답한다.';

export const maxDuration = 30; // Vercel 함수 타임아웃 (Pro 30s; Hobby는 10s로 캡되며 클라이언트 폴백이 받음)

const LLM_TIMEOUT_MS = 12000; // gpt-4o-mini가 가끔 8s를 넘겨 12s로 여유

const client = new OpenAI(); // OPENAI_API_KEY 환경변수 사용

async function generate(prompt: string): Promise<string> {
  const msg = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 1024,
    response_format: { type: 'json_object' }, // 항상 유효한 JSON 강제 (파싱 실패 폴백 방지)
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
  });
  const content = msg.choices[0]?.message?.content;
  if (!content) throw new Error('unexpected response');
  return content;
}

interface Body { analysis: TeamAnalysis; candidates: ScoredFood[]; seed: string; }

function isValidBody(b: unknown): b is Body {
  const x = b as Body;
  return !!x && !!x.analysis?.teamPct && Array.isArray(x.candidates)
    && x.candidates.length >= 3 && x.candidates.length <= 50
    && typeof x.seed === 'string';
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
    const result = await buildRecommendation(
      body.analysis, body.candidates, generate, body.seed, LLM_TIMEOUT_MS,
    );
    return NextResponse.json(result);
  } catch {
    // buildRecommendation 내부에서 폴백하지만, 만약의 경우까지 방어
    return NextResponse.json(buildFallback(body.analysis, body.candidates, body.seed));
  }
}
