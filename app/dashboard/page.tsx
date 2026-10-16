import SentimentDashboard from '@/components/SentimentDashboard';

const SURVEY_ID =
  process.env.NEXT_PUBLIC_SURVEY_ID ?? 'd0000001-0000-0000-0000-000000000001';

export default function DashboardPage() {
  return <SentimentDashboard surveyId={SURVEY_ID} />;
}
