# PR Submission — CALL-E: Your Code Is Calling

**File:** `submissions/sentimentlive.md` (add to awesome-phone-call-agents repo)

---

## PR Title

`Add sentimentLive — real-time event sentiment via CALL-E voice calls`

## PR Body

### What it does

**sentimentLive** uses CALL-E to place outbound voice calls to event attendees *during* a live event, collect verbal feedback, score sentiment with Claude Haiku, and push real-time 🔴/🟡/🟢 alerts to an event planner's dashboard.

The event planner can course-correct on the spot — adjust the agenda, message catering, or push a new question — while the event is still happening.

### CALL-E integration

- `POST /v1/calls` for each opted-in attendee with a custom voice prompt
- `webhook_url` receives the completed transcript
- `metadata` carries `survey_id`, `question_id`, `opt_in_id` through the call → webhook round-trip

### Why this is practical

Every major event platform (Cvent, Swoogo, Bizzabo) does post-event surveys. Nobody does real-time. The only blocker was placing the calls — CALL-E removes that blocker entirely. No Twilio setup, no phone number provisioning, no IVR. 20 free calls is enough for a real 10-person demo.

### Tech stack

Next.js 15 · Supabase Realtime · Claude Haiku · CALL-E

### Repo

https://github.com/studio0x/sentimentlive

### Demo

http://localhost:3000/demo (or deployed URL)

---

## Entry file content for awesome-phone-call-agents

```markdown
## sentimentLive

**Real-time event sentiment intelligence, delivered by voice.**

An event planner pushes a question from their dashboard. CALL-E calls every opted-in attendee. Their verbal responses are transcribed, scored with Claude Haiku, and aggregated into a live 🔴/🟡/🟢 sentiment alert — all while the event is still running.

- **CALL-E usage:** `POST /v1/calls` per attendee, transcript via webhook
- **Stack:** Next.js 15, Supabase Realtime, Claude Haiku
- **Use case:** Live event management — course-correct in real time, not after
- **Repo:** https://github.com/studio0x/sentimentlive
```

---

## Submission checklist

- [x] `/api/calle/call` — triggers outbound calls via CALL-E API
- [x] `/api/calle/webhook` — receives transcript, scores sentiment, updates dashboard
- [x] `lib/insight-agent.ts` — Claude Haiku scoring + insight aggregation
- [x] README rewritten as full submission doc
- [x] TypeScript clean (0 errors)
- [x] `.env.example` with all required vars documented
- [ ] CALLE_API_KEY filled in `.env.local`
- [ ] ANTHROPIC_API_KEY filled in `.env.local`
- [ ] NEXT_PUBLIC_APP_URL set to deployed/ngrok URL
- [ ] 200-call top-up submitted at forms.gle/EPQttEZ1rkW8iq9q6
- [ ] PR opened at github.com/CALLE-AI/awesome-phone-call-agents
