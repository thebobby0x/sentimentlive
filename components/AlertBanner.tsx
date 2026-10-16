'use client';

import type { ActionFlag, SentimentInsight } from '@/lib/types';

export default function AlertBanner({
  liveAlert,
  worstInsight,
}: {
  liveAlert: ActionFlag;
  worstInsight: SentimentInsight | null;
}) {
  if (liveAlert === 'ok') return null;

  const isAct = liveAlert === 'act';

  return (
    <div
      role="alert"
      className={`mb-6 flex items-start gap-3 rounded-xl border px-5 py-4 ${
        isAct
          ? 'border-red-500/40 bg-red-500/10 text-red-300'
          : 'border-amber-500/40 bg-amber-500/10 text-amber-300'
      }`}
    >
      <span
        className={`mt-0.5 flex-shrink-0 text-lg ${isAct ? 'sl-pulse' : ''}`}
      >
        {isAct ? '🔴' : '🟡'}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-sm">
          {isAct ? 'Action required' : 'Heads up'} ·{' '}
          {worstInsight?.question_text ?? 'Attendee feedback'}
        </p>
        {worstInsight?.recommended_action && (
          <p className="mt-0.5 text-xs opacity-80">
            {worstInsight.recommended_action}
          </p>
        )}
      </div>
      <span
        className={`flex-shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
          isAct
            ? 'border-red-500/30 bg-red-500/15 text-red-400'
            : 'border-amber-500/30 bg-amber-500/15 text-amber-400'
        }`}
      >
        {isAct ? 'ACT NOW' : 'WATCH'}
      </span>
    </div>
  );
}
