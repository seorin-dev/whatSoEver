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
