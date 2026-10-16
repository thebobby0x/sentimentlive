import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import type { SurveyWithInsights } from '@/lib/types';
import { overallAlert } from '@/lib/compute';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const surveyId = searchParams.get('survey_id');

  if (!surveyId) {
    return NextResponse.json({ error: 'survey_id required' }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Fetch survey
  const { data: survey, error: surveyErr } = await supabase
    .from('surveys')
    .select('*')
    .eq('id', surveyId)
    .single();

  if (surveyErr || !survey) {
    return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
  }

  // Fetch questions
  const { data: questions } = await supabase
    .from('survey_questions')
    .select('*')
    .eq('survey_id', surveyId)
    .order('sort_order');

  // Fetch insights, join question text
  const { data: insightsRaw } = await supabase
    .from('sentiment_insights')
    .select('*')
    .eq('survey_id', surveyId)
    .order('last_updated', { ascending: false });

  const questionMap = new Map(
    (questions ?? []).map((q: { id: string; text: string }) => [q.id, q.text])
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const insights = (insightsRaw ?? []).map((i: any) => ({
    ...i,
    question_text: (questionMap.get(i.question_id) as string) ?? '',
  }));

  const result: SurveyWithInsights = {
    survey,
    questions: questions ?? [],
    insights,
    liveAlert: overallAlert(insights),
  };

  return NextResponse.json(result);
}
