'use client';

import type { SentimentInsight, SurveyQuestion } from '@/lib/types';
import { Card, Badge } from './ui';
import ScoreGauge from './ScoreGauge';

// sentiment_insights rows as written by refreshInsight() use these column
// names; the SentimentInsight type carries the older ones.
type InsightRow = SentimentInsight & {
  avg_sentiment?: number | null;
  recommendation?: string | null;
  top_themes?: string[] | null;
};

export default function QuestionInsightCard({
  insight,
  question,
}: {
  insight: SentimentInsight;
  question: SurveyQuestion | undefined;
}) {
  const row = insight as InsightRow;
  const recommendation = row.recommendation ?? insight.recommended_action;
  const themes = row.top_themes ?? insight.sample_quotes;
  const questionText = insight.question_text ?? question?.text ?? 'Question';
  const isAct = insight.action_flag === 'act';
  const isWatch = insight.action_flag === 'watch';

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-[#f4eef1] leading-snug flex-1">
          {questionText}
        </h3>
        <Badge flag={insight.action_flag} />
      </div>

      <div className="mt-4">
        <ScoreGauge score={row.avg_sentiment ?? insight.avg_score ?? 0} flag={insight.action_flag} />
      </div>

      <div className="mt-3 text-xs text-[#9b8f95]">
        {insight.response_count} response{insight.response_count === 1 ? '' : 's'}
      </div>

      {isAct && recommendation && (
        <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5">
          <p className="text-xs font-semibold text-red-400">Action needed</p>
          <p className="mt-0.5 text-xs text-red-300/80">
            {recommendation}
          </p>
        </div>
      )}

      {isWatch && (
        <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5">
          <p className="text-xs font-semibold text-amber-400">Watch</p>
          <p className="mt-0.5 text-xs text-amber-300/80">
            {recommendation ?? 'Monitor closely — check again in 15 minutes.'}
          </p>
        </div>
      )}

      {themes && themes.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {themes.slice(0, 2).map((q: string, i: number) => (
            <p key={i} className="text-xs text-[#9b8f95] italic">
              &ldquo;{q}&rdquo;
            </p>
          ))}
        </div>
      )}
    </Card>
  );
}
