import 'server-only';
import { createServiceClient } from '@/lib/supabase/server';
import { scoreToFlag } from '@/lib/compute';
import type { ActionFlag } from '@/lib/types';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? '';

interface ScoreResult {
  score: number; // -1 to 1
  action_flag: ActionFlag;
  one_liner: string; // short quote/theme for sample_quotes
}

/**
 * Score a single text response with Claude Haiku.
 * Falls back to keyword heuristic if no API key is set.
 */
export async function scoreResponse(text: string): Promise<ScoreResult> {
  if (!ANTHROPIC_API_KEY) {
    return heuristicScore(text);
  }

  try {
    const res = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 128,
        system:
          'You are a sentiment scorer for event feedback. ' +
          'Respond ONLY with a JSON object: ' +
          '{"score": <number -1 to 1>, "one_liner": "<5-10 word quote or theme>"}. ' +
          'score: 1=very positive, 0=neutral, -1=very negative.',
        messages: [{ role: 'user', content: text }],
      }),
    });

    if (!res.ok) throw new Error(`Anthropic ${res.status}`);

    const data = (await res.json()) as {
      content: Array<{ text: string }>;
    };
    const raw = data.content?.[0]?.text ?? '{}';
    const parsed = JSON.parse(raw) as { score?: number; one_liner?: string };
    const score = clamp(parsed.score ?? 0, -1, 1);
    return {
      score,
      action_flag: scoreToFlag(score),
      one_liner: parsed.one_liner ?? text.slice(0, 80),
    };
  } catch {
    return heuristicScore(text);
  }
}

function heuristicScore(text: string): ScoreResult {
  const lower = text.toLowerCase();
  const pos = ['great', 'love', 'excellent', 'amazing', 'good', 'happy', 'perfect', 'helpful'];
  const neg = ['bad', 'terrible', 'awful', 'boring', 'slow', 'confusing', 'poor', 'hate', 'disappointed'];
  let score = 0;
  pos.forEach((w) => { if (lower.includes(w)) score += 0.3; });
  neg.forEach((w) => { if (lower.includes(w)) score -= 0.3; });
  score = clamp(score, -1, 1);
  return { score, action_flag: scoreToFlag(score), one_liner: text.slice(0, 80) };
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

/**
 * Re-compute sentiment_insights for a question from all its stored responses.
 * Upserts the insight row so the dashboard reflects the latest data.
 */
export async function refreshInsight(
  surveyId: string,
  questionId: string,
): Promise<void> {
  const supabase = createServiceClient();

  const { data: responses, error } = await supabase
    .from('survey_responses')
    .select('sentiment_score, action_flag, response_text')
    .eq('question_id', questionId);

  if (error || !responses || responses.length === 0) return;

  type RespRow = { sentiment_score: number; action_flag: string; response_text: string };
  const rows = responses as RespRow[];
  const scores = rows.map((r) => r.sentiment_score).filter((s) => s !== null);
  const avg_score = scores.reduce((a: number, b: number) => a + b, 0) / scores.length;
  const response_count = rows.length;

  // Worst flag wins
  let action_flag: ActionFlag = 'ok';
  if (rows.some((r) => r.action_flag === 'act')) action_flag = 'act';
  else if (rows.some((r) => r.action_flag === 'watch')) action_flag = 'watch';

  // Sample quotes: up to 3 responses near the extremes
  const sorted = [...rows].sort(
    (a: RespRow, b: RespRow) => a.sentiment_score - b.sentiment_score,
  );
  const sample_quotes = [
    sorted[0]?.response_text,
    sorted[Math.floor(sorted.length / 2)]?.response_text,
    sorted[sorted.length - 1]?.response_text,
  ]
    .filter((q): q is string => Boolean(q))
    .slice(0, 3);

  // Derive a short recommended action from the flag
  const recommended_action =
    action_flag === 'act'
      ? 'Immediate attention needed — escalate to event team.'
      : action_flag === 'watch'
      ? 'Monitor closely — check again in 15 minutes.'
      : 'All good — no action required.';

  await supabase.from('sentiment_insights').upsert(
    {
      survey_id: surveyId,
      question_id: questionId,
      avg_score,
      response_count,
      action_flag,
      sample_quotes,
      recommended_action,
      last_updated: new Date().toISOString(),
    },
    { onConflict: 'survey_id,question_id' },
  );
}
