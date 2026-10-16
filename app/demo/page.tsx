// IMEX demo — hardcoded to the pre-seeded survey.
// Uses the real Supabase client hitting real data (not mocks).
import SentimentDashboard from '@/components/SentimentDashboard';
import { DEMO_SURVEY_ID } from '@/lib/constants';

export default function DemoPage() {
  return <SentimentDashboard surveyId={DEMO_SURVEY_ID} />;
}
