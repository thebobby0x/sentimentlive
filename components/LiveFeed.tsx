'use client';

import * as React from 'react';
import type { FeedItem } from '@/lib/types';
import { flagBg, flagLabel, timeAgo } from '@/lib/format';

export default function LiveFeed({ items }: { items: FeedItem[] }) {
  const topRef = React.useRef<HTMLDivElement>(null);

  // Scroll newest item into view when feed updates
  React.useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [items.length]);

  if (items.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-[#9b8f95]">
        No responses yet. Waiting for attendee messages…
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div ref={topRef} />
      {items.map((item, idx) => (
        <div
          key={item.id}
          className={`flex items-start gap-3 rounded-lg border border-noir-600 bg-noir-800 px-4 py-3 ${
            idx === 0 ? 'sl-slide-in' : ''
          }`}
        >
          {/* Score chip */}
          <span
            className={`mt-0.5 flex-shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${flagBg(item.action_flag)}`}
          >
            {flagLabel(item.action_flag)}
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-xs text-[#9b8f95]">{item.question_text}</p>
            <p className="mt-0.5 text-sm text-[#f4eef1] leading-snug">
              {item.response_text}
            </p>
          </div>

          <div className="flex-shrink-0 text-right">
            <p className="text-[11px] font-mono text-[#9b8f95]">
              {item.sentiment_score > 0 ? '+' : ''}
              {item.sentiment_score.toFixed(2)}
            </p>
            <p className="mt-0.5 text-[10px] text-[#6b5f65]">
              {timeAgo(item.created_at)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
