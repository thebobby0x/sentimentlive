// sentimentLive — shared TypeScript types

export type ActionFlag = 'ok' | 'watch' | 'act';

export interface Survey {
  id: string;
  event_id: string;
  title: string;
  status: string;
  created_at: string;
}

export interface SurveyQuestion {
  id: string;
  survey_id: string;
  text: string;
  trigger_type: string;
  schedule_offset_minutes: number | null;
  sort_order: number;
  active: boolean;
}

export interface AttendeeOptIn {
  id: string;
  survey_id: string;
  phone_number: string;
  opted_in_at: string;
}

export interface SurveyResponse {
  id: string;
  question_id: string;
  opt_in_id: string;
  response_text: string;
  sentiment_score: number; // -1 to 1
  action_flag: ActionFlag;
  processed_at: string | null;
  created_at: string;
  // joined
  question_text?: string;
}

export interface SentimentInsight {
  id: string;
  survey_id: string;
  question_id: string;
  avg_score: number;
  response_count: number;
  action_flag: ActionFlag;
  sample_quotes: string[] | null;
  recommended_action: string | null;
  last_updated: string;
  // joined
  question_text?: string;
}

// Derived types for the dashboard
export interface SurveyWithInsights {
  survey: Survey;
  questions: SurveyQuestion[];
  insights: SentimentInsight[];
  liveAlert: ActionFlag;
}

export interface FeedItem extends SurveyResponse {
  question_text: string;
}
