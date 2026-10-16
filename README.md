# sentimentLive × CALL-E

**Real-time event sentiment intelligence, delivered by voice.**

sentimentLive uses the [CALL-E API](https://calle.ai) to place outbound calls to event attendees, collect verbal feedback in real time, and surface actionable sentiment scores on a live control-room dashboard — while the event is still happening.

---

## The Problem

Event planners survey attendees *after* the event. By then, dinner was already bad, the sessions were already too long, and nothing could be fixed. Post-event surveys are post-mortems, not tools for action.

## The Solution

sentimentLive calls attendees *during* the event. An AI voice agent asks a targeted question ("How's the energy in the room?"), transcribes the response, scores sentiment with Claude Haiku, and pushes a live 🔴/🟡/🟢 alert to the planner's dashboard. The planner can course-correct in real time — adjust the agenda, message catering, or push a new question.

---

## How CALL-E Powers It

### 1. Outbound Call Trigger

```
POST /api/calle/call
{ "survey_id": "...", "question_id": "..." }
```

For each opted-in attendee, sentimentLive fires:

```
POST https://api.calle.ai/v1/calls
{
  "to": "+1555...",
  "prompt": "You are a friendly event assistant. Ask: 'How's the room energy right now?' Listen, thank them, end the call.",
  "webhook_url": "https://your-app.com/api/calle/webhook",
  "metadata": { "survey_id": "...", "question_id": "...", "opt_in_id": "..." }
}
```

CALL-E places the call, handles the voice interaction, and returns a transcript.

### 2. Transcript Webhook

```
POST /api/calle/webhook
```

CALL-E POSTs the completed transcript here. sentimentLive:

1. Extracts the attendee's spoken response
2. Scores it with **Claude Haiku** (`-1.0 → 1.0`)
3. Maps the score to an action flag: `ok (≥0.3)` / `watch (≥-0.1)` / `act (<-0.1)`
4. Stores the response in `survey_responses`
5. Recomputes the `sentiment_insights` aggregate for that question

### 3. Live Dashboard

The dashboard polls every 30 seconds and subscribes to Supabase Realtime for instant feed updates. New responses appear in the live feed the moment they're stored, and the 🔴/🟡/🟢 alert banner updates automatically.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Event Planner (Browser)             │
│  controlRoom Dashboard — polls /api/sentiment/survey │
│  Live feed — Supabase Realtime on survey_responses   │
└──────────────────────────┬──────────────────────────┘
                           │ 30s poll + realtime INSERT
┌──────────────────────────▼──────────────────────────┐
│              sentimentLive (Next.js 15)              │
│                                                      │
│  POST /api/calle/call ──────► CALL-E API             │
│         ▲                     │ outbound calls       │
│         │                     │ transcript callback  │
│  Planner hits [Push Question] ▼                      │
│  POST /api/calle/webhook ◄─── CALL-E Webhook         │
│         │                                            │
│         ├─► scoreResponse()  (Claude Haiku)          │
│         ├─► INSERT survey_responses                  │
│         └─► refreshInsight() → UPSERT sentiment_insights
│                                                      │
└──────────────────────────┬──────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────┐
│              Supabase (your project)             │
│  sentiment_surveys · survey_questions                │
│  attendee_opt_ins · survey_responses                 │
│  sentiment_insights                                  │
└─────────────────────────────────────────────────────┘
```

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Database | Supabase (Postgres + Realtime) |
| Voice calls | **CALL-E API** |
| Sentiment scoring | Claude Haiku (`claude-haiku-4-5-20251001`) |
| Styling | Tailwind CSS v4 |
| Language | TypeScript |

---

## API Routes

| Route | Method | Description |
|---|---|---|
| `/api/calle/call` | POST | Trigger outbound CALL-E calls for a question |
| `/api/calle/webhook` | POST | Receive CALL-E transcript, score, store |
| `/api/sentiment/survey` | GET | Fetch survey + insights for dashboard |
| `/api/sentiment/feed` | GET | Fetch latest response feed |

---

## Setup

### 1. Clone and install

```bash
git clone <repo>
cd sentimentLive
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
CALLE_API_KEY=your-calle-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
NEXT_PUBLIC_APP_URL=https://your-public-url.com
NEXT_PUBLIC_SURVEY_ID=d0000001-0000-0000-0000-000000000001
```

### 3. Run the demo

```bash
npm run dev
```

Open `http://localhost:3000/demo` — the live dashboard with seeded data.

### 4. Test a voice call (requires ngrok for local dev)

```bash
ngrok http 3000
# Set NEXT_PUBLIC_APP_URL to your ngrok URL
```

Then trigger a call:

```bash
curl -X POST http://localhost:3000/api/calle/call \
  -H "Content-Type: application/json" \
  -d '{"survey_id":"d0000001-0000-0000-0000-000000000001","question_id":"<question-id>"}'
```

Watch the dashboard update in real time as CALL-E calls attendees and responses arrive.

---

## Database Schema

```sql
-- Attendees who opted in to receive calls
CREATE TABLE attendee_opt_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID REFERENCES sentiment_surveys(id),
  phone_number TEXT NOT NULL,
  opted_in_at TIMESTAMPTZ DEFAULT now()
);

-- Individual voice responses (one per attendee per question)
CREATE TABLE survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES survey_questions(id),
  opt_in_id UUID REFERENCES attendee_opt_ins(id),
  response_text TEXT,
  sentiment_score NUMERIC,         -- -1 to 1
  action_flag TEXT,                -- ok | watch | act
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Aggregated insight per question (refreshed after each new response)
CREATE TABLE sentiment_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID,
  question_id UUID UNIQUE,
  avg_score NUMERIC,
  response_count INT,
  action_flag TEXT,
  sample_quotes TEXT[],
  recommended_action TEXT,
  last_updated TIMESTAMPTZ
);
```

---

## The CALL-E Advantage

- **Zero infrastructure** — no Twilio account, no phone number provisioning, no IVR setup. CALL-E handles the call, the voice interaction, and the transcript.
- **20 free calls** — enough for a real demo with 10 attendees, 2 questions each.
- **Sub-60-second calls** — short, respectful, feels like a human check-in.
- **Runs during the event** — not after. The value proposition is *timing*, and CALL-E makes that timing possible.

---

## Real-World Demo

Built for IMEX Frankfurt (Oct 12–15, 2026) — 10 event planners, 3 live questions during a session, real-time dashboard on a 55" display at the booth. The close: *"Cvent doesn't do this. Nobody does this."*

---

## License

MIT

---

*Built with [CALL-E](https://calle.ai) · [Anthropic Claude](https://anthropic.com) · [Supabase](https://supabase.com)*
