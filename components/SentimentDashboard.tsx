'use client';

import * as React from 'react';
import type { SurveyWithInsights, FeedItem, SentimentInsight } from '@/lib/types';
import { overallAlert, worstInsight } from '@/lib/compute';
import { createClient } from '@/lib/supabase/client';
import { POLL_INTERVAL_MS } from '@/lib/constants';
import AlertBanner from './AlertBanner';
import QuestionInsightCard from './QuestionInsightCard';
import LiveFeed from './LiveFeed';
import { Spinner, LiveDot } from './ui';

async function fetchSurveyData(
  surveyId: string
): Promise<SurveyWithInsights | null> {
  const res = await fetch(`/api/sentiment/survey?survey_id=${surveyId}`, {
    cache: 'no-store',
  });
  if (!res.ok) return null;
  return res.json() as Promise<SurveyWithInsights>;
}

async function fetchFeed(surveyId: string): Promise<FeedItem[]> {
  const res = await fetch(`/api/sentiment/feed?survey_id=${surveyId}`, {
    cache: 'no-store',
  });
  if (!res.ok) return [];
  return res.json() as Promise<FeedItem[]>;
}

export default function SentimentDashboard({ surveyId }: { surveyId: string }) {
  const [data, setData] = React.useState<SurveyWithInsights | null>(null);
  const [feed, setFeed] = React.useState<FeedItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    const [surveyData, feedData] = await Promise.all([
      fetchSurveyData(surveyId),
      fetchFeed(surveyId),
    ]);
    if (surveyData) setData(surveyData);
    setFeed(feedData);
    setLoading(false);
  }, [surveyId]);

  // Initial load
  React.useEffect(() => {
    void load();
  }, [load]);

  // 30s poll for insight updates
  React.useEffect(() => {
    const id = setInterval(() => void load(), POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [load]);

  // Realtime subscription — prepend new responses to feed
  React.useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`sentiment-feed-${surveyId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'survey_responses',
        },
        (payload) => {
          const newRow = payload.new as FeedItem;
          // Enrich with question text if available
          setFeed((prev) => [newRow, ...prev].slice(0, 20));
          // Also re-fetch insights after a short delay
          setTimeout(() => void load(), 2000);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [surveyId, load]);

  if (loading) return <Spinner />;
  if (!data) {
    return (
      <div className="py-16 text-center text-sm text-[#9b8f95]">
        Survey not found.
      </div>
    );
  }

  const liveAlert = overallAlert(data.insights);
  const worst = worstInsight(data.insights);

  // Map insights back to their questions
  const questionMap = new Map(data.questions.map((q) => [q.id, q]));

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#9b8f95]">
              sentimentLive
            </span>
            <LiveDot />
          </div>
          <h1 className="mt-1 text-2xl font-bold text-[#f4eef1]">
            {data.survey.title}
          </h1>
          <p className="mt-0.5 text-xs text-[#9b8f95]">
            {data.insights.reduce((s, i) => s + i.response_count, 0)} responses ·{' '}
            {data.questions.length} question{data.questions.length === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      {/* Alert banner */}
      <AlertBanner liveAlert={liveAlert} worstInsight={worst} />

      {/* Question insights */}
      <section aria-label="Question insights">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#9b8f95]">
          By question
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {data.insights.map((insight) => (
            <QuestionInsightCard
              key={insight.id}
              insight={insight}
              question={questionMap.get(insight.question_id)}
            />
          ))}
          {data.insights.length === 0 && (
            <p className="col-span-2 py-8 text-center text-sm text-[#9b8f95]">
              No insights yet — responses are still coming in.
            </p>
          )}
        </div>
      </section>

      {/* Live feed */}
      <section aria-label="Live response feed" className="mt-8">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#9b8f95]">
          Live feed
        </h2>
        <LiveFeed items={feed} />
      </section>
    </div>
  );
}
