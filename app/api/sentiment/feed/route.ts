import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import type { FeedItem } from '@/lib/types';
import { FEED_LIMIT } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const surveyId = searchParams.get('survey_id');

  if (!surveyId) {
    return NextResponse.json({ error: 'survey_id required' }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Get question IDs for this survey
  const { data: questions } = await supabase
    .from('survey_questions')
    .select('id, question_text')
    .eq('survey_id', surveyId);

  if (!questions || questions.length === 0) {
    return NextResponse.json([]);
  }

  const questionIds = questions.map((q: { id: string; question_text: string }) => q.id);
  const questionMap = new Map(
    questions.map((q: { id: string; question_text: string }) => [q.id, q.question_text])
  );

  // Fetch latest responses for those questions
  const { data: responses } = await supabase
    .from('survey_responses')
    .select('*')
    .in('question_id', questionIds)
    .order('received_at', { ascending: false })
    .limit(FEED_LIMIT);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const feed: FeedItem[] = (responses ?? []).map((r: any) => ({
    ...r,
    question_text: (questionMap.get(r.question_id) as string) ?? '',
  }));

  return NextResponse.json(feed);
}
