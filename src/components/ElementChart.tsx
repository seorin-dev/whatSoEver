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
