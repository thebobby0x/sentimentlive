import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/health
 *
 * Uptime probe for UptimeRobot (see DEPLOYMENT.md). Returns 200 with
 * `"status":"ok"` when the required env is present and Supabase answers;
 * 503 otherwise. Reports only presence/booleans — never secret values.
 */
export async function GET() {
  const env = {
    supabase: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
    ),
    anthropic: Boolean(process.env.ANTHROPIC_API_KEY),
    calle: Boolean(process.env.CALLE_API_KEY),
    webhook_secret: Boolean(process.env.CALLE_WEBHOOK_SECRET),
  };

  let db = false;
  if (env.supabase) {
    try {
      const { error } = await createServiceClient()
        .from('surveys')
        .select('id', { head: true, count: 'exact' })
        .limit(1);
      db = !error;
    } catch {
      db = false;
    }
  }

  // Anthropic and CALL-E degrade (heuristic scoring / no outbound calls) rather
  // than break the dashboard, so only env + DB gate the status code.
  const ok = env.supabase && db;

  return NextResponse.json(
    { status: ok ? 'ok' : 'degraded', db, env, time: new Date().toISOString() },
    { status: ok ? 200 : 503, headers: { 'Cache-Control': 'no-store' } },
  );
}
