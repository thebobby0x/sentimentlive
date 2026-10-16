// sentimentLive — derived computations

import type { ActionFlag, SentimentInsight } from './types';

/** Map a raw sentiment score (-1 → 1) to an action flag. */
export function scoreToFlag(score: number): ActionFlag {
  if (score >= 0.3) return 'ok';
  if (score >= -0.1) return 'watch';
  return 'act';
}

/** Derive the overall live alert from a list of insights. Worst wins. */
export function overallAlert(insights: SentimentInsight[]): ActionFlag {
  if (insights.some((i) => i.action_flag === 'act')) return 'act';
  if (insights.some((i) => i.action_flag === 'watch')) return 'watch';
  return 'ok';
}

/** Return the insight with the worst action_flag (used for banner copy). */
export function worstInsight(
  insights: SentimentInsight[]
): SentimentInsight | null {
  const acts = insights.filter((i) => i.action_flag === 'act');
  if (acts.length > 0) return acts[0];
  const watches = insights.filter((i) => i.action_flag === 'watch');
  if (watches.length > 0) return watches[0];
  return null;
}

/** Convert avg_score (-1 to 1) to a 0–100 percent for gauge positioning. */
export function scoreToPct(score: number): number {
  return Math.round(((score + 1) / 2) * 100);
}
