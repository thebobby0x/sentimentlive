import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

const CALLE_API_URL = 'https://api.calle.ai/v1/calls';
const CALLE_API_KEY = process.env.CALLE_API_KEY ?? '';

interface CallDispatch {
  opt_in_id: string;
  phone_number: string;
  call_id?: string;
  error?: string;
}

/**
 * POST /api/calle/call
 *
 * Triggers outbound voice calls via CALL-E for every opted-in attendee
 * on a given question. The CALL-E call will collect the attendee's verbal
 * response, then POST back to /api/calle/webhook with the transcript.
 *
 * Body: { survey_id: string; question_id: string }
 * Returns: { dispatched: number; results: CallDispatch[] }
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { survey_id, question_id } = body as {
    survey_id?: string;
    question_id?: string;
  };

  if (!survey_id || !question_id) {
    return NextResponse.json(
      { error: 'survey_id and question_id are required' },
      { status: 400 },
    );
  }

  if (!CALLE_API_KEY) {
    return NextResponse.json(
      { error: 'CALLE_API_KEY is not configured' },
      { status: 500 },
    );
  }

  const supabase = createServiceClient();

  // Fetch the question text so we can include it in the voice prompt
  const { data: question, error: qErr } = await supabase
    .from('survey_questions')
    .select('id, text')
    .eq('id', question_id)
    .single();

  if (qErr || !question) {
    return NextResponse.json({ error: 'Question not found' }, { status: 404 });
  }

  // Fetch all opted-in attendees for this survey
  const { data: optIns, error: oErr } = await supabase
    .from('attendee_opt_ins')
    .select('id, phone_number')
    .eq('survey_id', survey_id);

  if (oErr) {
    return NextResponse.json(
      { error: 'Failed to fetch opt-ins', detail: oErr.message },
      { status: 500 },
    );
  }

  if (!optIns || optIns.length === 0) {
    return NextResponse.json({ dispatched: 0, results: [] });
  }

  // Build the webhook URL — must be publicly reachable by CALL-E.
  // Order: explicit NEXT_PUBLIC_APP_URL → Vercel's stable production domain
  // (auto-set on Vercel) → the request host. `||` so an empty value falls through.
  const appUrl = (
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : `https://${req.headers.get('host') ?? 'localhost:3000'}`)
  ).replace(/\/+$/, '');
  const webhookSecret = process.env.CALLE_WEBHOOK_SECRET;
  const webhookUrl = webhookSecret
    ? `${appUrl}/api/calle/webhook?token=${encodeURIComponent(webhookSecret)}`
    : `${appUrl}/api/calle/webhook`;

  const results: CallDispatch[] = await Promise.all(
    optIns.map(async (optIn: { id: string; phone_number: string }) => {
      try {
        const res = await fetch(CALLE_API_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${CALLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            // CALL-E v1/calls payload
            to: optIn.phone_number,
            prompt: buildVoicePrompt(question.text),
            webhook_url: webhookUrl,
            metadata: {
              survey_id,
              question_id,
              opt_in_id: optIn.id,
            },
          }),
        });

        if (!res.ok) {
          const errText = await res.text();
          return {
            opt_in_id: optIn.id,
            phone_number: optIn.phone_number,
            error: `CALL-E ${res.status}: ${errText}`,
          };
        }

        const data = (await res.json()) as { id?: string; call_id?: string };
        return {
          opt_in_id: optIn.id,
          phone_number: optIn.phone_number,
          call_id: data.id ?? data.call_id,
        };
      } catch (err) {
        return {
          opt_in_id: optIn.id,
          phone_number: optIn.phone_number,
          error: String(err),
        };
      }
    }),
  );

  const dispatched = results.filter((r) => !r.error).length;

  return NextResponse.json({ dispatched, results });
}

function buildVoicePrompt(questionText: string): string {
  return (
    `You are a friendly event assistant calling to collect feedback. ` +
    `Ask the attendee: "${questionText}" ` +
    `Listen to their response, thank them briefly, and end the call. ` +
    `Keep the call under 60 seconds. Do not go off-topic.`
  );
}
