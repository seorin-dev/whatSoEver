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
  // 과다 기운이 없어도(균형 팀) 최다 기운 캐릭터를 주인공으로 보여준다
  const dominant = ELEMENT_KEYS.reduce((a, b) =>
    analysis.teamPct[b] > analysis.teamPct[a] ? b : a,
  );
  const main = analysis.excess[0] ?? dominant;
  const isExcess = analysis.excess.length > 0;

  return (
    <div className="glow-card p-4">
      <p className="mb-2 text-xs uppercase tracking-widest text-ink-dim">팀 오행 분포</p>
      <div className="flex items-center gap-3">
        <div className="h-44 w-44 shrink-0">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={data} dataKey="value" innerRadius={50} outerRadius={82}
                strokeWidth={0} isAnimationActive>
                {data.map((d) => <Cell key={d.key} fill={CHART_COLORS[d.key]} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 text-sm">
          <div className="mb-2 flex items-center gap-2">
            <ElementCharacter element={main} size={52} />
            <span>
              <b style={{ color: CHART_COLORS[main] }}>
                {ELEMENT_LABEL[main]} {analysis.teamPct[main]}%
              </b>{' '}
              — {isExcess
                ? `${ELEMENT_CHARACTER[main]} 과다!`
                : `오늘의 주인공은 ${ELEMENT_CHARACTER[main]}`}
            </span>
          </div>
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
