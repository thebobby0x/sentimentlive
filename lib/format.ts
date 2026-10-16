// sentimentLive — display formatters

import type { ActionFlag } from './types';

export function formatScore(score: number): string {
  const sign = score > 0 ? '+' : '';
  return `${sign}${score.toFixed(2)}`;
}

export function flagLabel(flag: ActionFlag): string {
  switch (flag) {
    case 'act':
      return 'ACT NOW';
    case 'watch':
      return 'WATCH';
    case 'ok':
      return 'OK';
  }
}

export function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return new Date(iso).toLocaleDateString();
}

export function flagColor(flag: ActionFlag): string {
  switch (flag) {
    case 'act':
      return 'text-red-400';
    case 'watch':
      return 'text-amber-400';
    case 'ok':
      return 'text-riptide';
  }
}

export function flagBg(flag: ActionFlag): string {
  switch (flag) {
    case 'act':
      return 'bg-red-500/15 text-red-400 border-red-500/30';
    case 'watch':
      return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    case 'ok':
      return 'bg-riptide/15 text-riptide border-riptide/30';
  }
}
