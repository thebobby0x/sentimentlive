'use client';

import * as React from 'react';
import type { ActionFlag } from '@/lib/types';
import { flagBg, flagLabel } from '@/lib/format';

export function Card({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-noir-600 bg-noir-800 ${className}`}
    >
      {children}
    </div>
  );
}

export function Badge({ flag }: { flag: ActionFlag }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${flagBg(flag)}`}
    >
      {flagLabel(flag)}
    </span>
  );
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-riptide border-t-transparent" />
    </div>
  );
}

export function LiveDot() {
  return (
    <span
      aria-hidden
      className="inline-block h-1.5 w-1.5 rounded-full bg-riptide sl-pulse"
    />
  );
}
