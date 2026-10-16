// sentimentLive — constants and brand tokens

export const BRAND = {
  noir: '#0F0C0E',
  rosa: '#F8BDD8',
  riptide: '#5DCBD1',
  warn: '#F5A623',
  over: '#EF4444',
} as const;

export const DEMO_SURVEY_ID = 'd0000001-0000-0000-0000-000000000001';
export const DEMO_EVENT_ID = 'a0000001-0000-0000-0000-000000000001';

export const SURVEY_ID =
  process.env.NEXT_PUBLIC_SURVEY_ID ?? DEMO_SURVEY_ID;

export const FEED_LIMIT = 20;
export const POLL_INTERVAL_MS = 30_000;
