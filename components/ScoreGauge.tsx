'use client';

// Horizontal gauge: red (left) → amber (center) → riptide (right)
// Needle sits at avg_score position.

import { formatScore, flagLabel } from '@/lib/format';
import { scoreToPct } from '@/lib/compute';
import type { ActionFlag } from '@/lib/types';

export default function ScoreGauge({
  score,
  flag,
}: {
  score: number;
  flag: ActionFlag;
}) {
  const pct = scoreToPct(score);

  const needleColor =
    flag === 'act'
      ? '#EF4444'
      : flag === 'watch'
        ? '#F5A623'
        : '#5DCBD1';

  return (
    <div className="w-full">
      {/* Track */}
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-gradient-to-r from-red-500 via-amber-400 to-riptide">
        {/* Needle */}
        <div
          className="absolute top-0 h-full w-0.5 -translate-x-1/2 rounded-full"
          style={{ left: `${pct}%`, backgroundColor: needleColor }}
          aria-hidden
        />
      </div>
      {/* Labels */}
      <div className="mt-1 flex justify-between text-[10px] text-[#9b8f95]">
        <span>−1</span>
        <span
          className="font-semibold"
          style={{ color: needleColor }}
        >
          {formatScore(score)} · {flagLabel(flag)}
        </span>
        <span>+1</span>
      </div>
    </div>
  );
}
