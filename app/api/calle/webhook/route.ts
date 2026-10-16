import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { scoreResponse, refreshInsight } from '@/lib/insight-agent';

/**
 * POST /api/calle/webhook
 *
 * Receives CALL-E transcript callbacks after a voice call completes.
 * Parses the transcript, scores sentiment via Claude Haiku,
 * stores the response in survey_responses, then refreshes
 * the sentiment_insights aggregate for that question.
 *
 * CALL-E payload shape (v1):
 * {
 *   call_id: string
 *   status: "completed" | "failed" | "no-answer"
 *   transcript: string          // full conversation transcript
 *   metadata: {
 *     survey_id: string
 *     question_id: string
 *     opt_in_id: string
 *   }
 *   duration_seconds?: number
 * }
 */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { call_id, status, transcript, metadata } = body as {
    call_id?: string;
    status?: string;
    transcript?: string;
    metadata?: {
      survey_id?: string;
      question_id?: string;
      opt_in_id?: string;
    };
  };

  // Only process completed calls with a transcript
  if (status !== 'completed' || !transcript) {
    console.log(`[calle/webhook] Skipping call ${call_id} — status: ${status}`);
    return NextResponse.json({ ok: true, skipped: true });
  }

  const survey_id = metadata?.survey_id;
  const question_id = metadata?.question_id;
  const opt_in_id = metadata?.opt_in_id;

  if (!survey_id || !question_id || !opt_in_id) {
    console.error('[calle/webhook] Missing metadata fields', metadata);
    return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
  }

  // Extract the attendee's response from the transcript.
  // CALL-E transcripts come as a conversation — we want the attendee's lines.
  const response_text = extractAttendeeResponse(transcript);

  if (!response_text) {
    console.warn('[calle/webhook] No attendee response found in transcript');
    return NextResponse.json({ ok: true, skipped: true, reason: 'empty-transcript' });
  }

  // Score via Claude Haiku (or fallback heuristic)
  const { score, action_flag, one_liner } = await scoreResponse(response_text);

  const supabase = createServiceClient();

  // Store the response
  const { error: insertErr } = await supabase.from('survey_responses').insert({
    question_id,
    opt_in_id,
    response_text,
    sentiment_score: score,
    action_flag,
    processed_at: new Date().toISOString(),
  });

  if (insertErr) {
    console.error('[calle/webhook] Insert failed', insertErr);
    return NextResponse.json(
      { error: 'Failed to store response', detail: insertErr.message },
      { status: 500 },
    );
  }

  // Refresh the aggregate insight (non-blocking — don't fail the webhook)
  refreshInsight(survey_id, question_id).catch((err) =>
    console.error('[calle/webhook] refreshInsight failed', err),
  );

  console.log(
    `[calle/webhook] ✅ call=${call_id} q=${question_id} score=${score.toFixed(2)} flag=${action_flag} — "${one_liner}"`,
  );

  return NextResponse.json({ ok: true, score, action_flag });
}

/**
 * Parse the attendee's lines from a CALL-E transcript.
 *
 * CALL-E transcripts are formatted as alternating speaker lines:
 *   Agent: <prompt text>
 *   User: <attendee response>
 *   Agent: Thank you, goodbye.
 *
 * We collect all "User:" lines and join them.
 */
function extractAttendeeResponse(transcript: string): string {
  const lines = transcript.split('\n');
  const attendeeLines = lines
    .filter((l) => /^(user|attendee|caller):/i.test(l.trim()))
    .map((l) => l.replace(/^(user|attendee|caller):\s*/i, '').trim())
    .filter(Boolean);

  if (attendeeLines.length > 0) {
    return attendeeLines.join(' ');
  }

  // Fallback: if no speaker labels, treat the entire transcript as the response
  // (some CALL-E integrations return raw speech-to-text without labels)
  return transcript.trim();
}
