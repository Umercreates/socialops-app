# Easyland — AI Social Media Sales & Automation Dashboard

An AI-powered Social Media Sales Operating System: one workspace that takes a lead from a
social media comment or DM, through WhatsApp and AI qualification, to an AI-run discovery
call, and finally hands the best opportunities to a human sales person — with every step
tracked in a built-in CRM.

This build is a fully interactive **frontend prototype**. Every flow works end-to-end
against realistic mock data and in-memory client state, with the architecture (types, mock
services, integration seams, client stores) shaped so real backends and third-party APIs
can be connected later without reworking the UI.

## Core features

**Social media management**
- Connect multiple social accounts (Instagram, Facebook, TikTok, LinkedIn, YouTube, X)
- Multi-platform post composer with per-platform previews, scheduling, and publishing
- Content calendar (month / week / list), scheduled & published post management
- Unified social inbox with notes, tags, and lead status
- Cross-platform comment moderation with sentiment filters
- Analytics: follower growth, engagement, platform performance
- Automation builder (WHEN → IF → THEN) with rules (run mode, working hours, retries,
  escalation) and a test-run simulator
- AI Assistant with a chat interface and a Knowledge Base tab

**AI sales pipeline (Social → WhatsApp → AI Call → Human Sales)**
- **WhatsApp** — a single connected Easyland WhatsApp Business number, dynamic QR code /
  click-to-chat link with a prefilled, variable-templated message
- **"Send WhatsApp Link"** action in the Social Inbox — hands an interested DM off to
  WhatsApp while preserving full source attribution (platform, campaign, original post/DM)
- **AI WhatsApp chatbot** — a live, interactive demo chatbot that qualifies a lead through
  natural conversation and classifies them (Cold / Warm / Interested / Qualified / Hot /
  Not Interested / Human Review) with a 0–100 lead score
- **Lead qualification** — only leads that clear a configurable score threshold are queued
  for a call; everyone else stays in the CRM for follow-up
- **AI Call Agent** — a Manual Approval call queue, a simulated live-call screen (timer,
  streaming transcript, AI notes, detected intent/objections), and a generated call summary
  (requirements, pain points, budget, timeline, objections, buying intent, next action)
- **Meeting booking** — mock available slots, assigned team member, and a booking flow
  architected for Google Calendar
- **Leads / CRM** — Kanban and table views over the full pipeline (New → Social DM →
  WhatsApp Started → AI Qualifying → Interested → Qualified → AI Call → Ready for Sales →
  Human Follow-up → Meeting → Won / Lost), with a full lead profile (contact info, source,
  WhatsApp history, qualification, call transcripts/summaries, meeting history, notes,
  timeline)
- **Human sales handoff** — a deliberate, human-triggered action (the AI never closes a
  deal itself): assign a sales person, set priority and next follow-up, mark contacted,
  mark meeting scheduled, mark won/lost
- **Google Sheets sync architecture** — every qualified lead / completed call can sync to
  a Google Sheet–shaped row (see [Mock vs. real](#mock-vs-real) — the sheet itself is not
  connected)
- **Dashboard funnel** — Social Media → DM → WhatsApp → AI Qualified → AI Call → Ready for
  Sales → Meeting → Customer, with conversion metrics at every stage

## Tech stack

- **Next.js 16** (App Router, Turbopack, React 19)
- **TypeScript**
- **Tailwind CSS v4**
- **shadcn/ui** (Base UI primitives) + **Lucide** icons
- `qrcode.react` for the WhatsApp QR code
- No backend, no database, no external APIs — everything is mock data and in-memory client
  state (see [Architecture notes](#architecture-notes))

## Current status

**Genuinely functional (client-side, no mocking):**
- Every filter, tab, dropdown, dialog, toggle, and view (Kanban/Table)
- Composer → Save Draft / Schedule / Publish Now → appears live in Calendar / Scheduled / Published
- Inbox replies, notes, tags, lead status, "Send WhatsApp Link"
- The WhatsApp AI chatbot conversation, live scoring, and call-queue gating logic
- The AI Call Agent's live-call UI, transcript streaming, and summary generation
- Lead CRM mutations: stage, priority, follow-up, assignment, notes, tags, timeline
- `wa.me` click-to-chat links and the QR code — these are **real, working links**, no API needed
- Automation create / enable / disable / duplicate / delete / test-run

**Mock / simulated — clearly not real:**
- **Authentication** — cookie-based session gate, not a real identity provider
- **Social publishing & OAuth** — simulated; nothing is sent to any real platform
- **WhatsApp Business Cloud API** — sending/receiving messages, the AI chatbot's "AI", and
  the connection status are all simulated (`src/lib/integrations/whatsapp`)
- **AI Call Agent telephony** — no real phone call is placed; transcripts are scripted
  (`src/lib/integrations/calling`)
- **Google Calendar** — meeting booking is simulated (`src/lib/integrations/calendar`)
- **Google Sheets** — sync is simulated locally; Settings honestly reports "Not connected"
  (`src/lib/integrations/sheets`)
- **AI Assistant** — responses are local string templates (`src/lib/services/ai-service.ts`);
  no LLM provider is connected
- **Analytics / engagement numbers** — deterministic seeded mock data, not live platform data

**Real integrations:** none yet. See [Future roadmap](#future-roadmap).

## Installation

```bash
git clone <this-repo-url>
cd <repo-directory>
npm install
```

## Environment setup

The app runs with zero configuration — no environment variables are read at runtime today.
`.env.example` documents the variables the architecture is ready for once a real
integration (WhatsApp Cloud API, Google Calendar/Sheets, Twilio, an LLM provider, etc.) is
connected:

```bash
cp .env.example .env.local
```

Leave it empty for local development; the app works fully on mock data either way.

## Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll land on `/login`.

**Demo login** (mock auth, pre-filled on the login screen):
- Email: `maya@easyland.co`
- Password: `demo1234`

## Build

```bash
npm run build
npm run start   # serve the production build locally
```

Other available scripts: `npm run lint` (ESLint), `npx tsc --noEmit` (type-check).

## Project structure

```
src/
  app/                    Next.js App Router routes (login, dashboard/*)
  components/
    dashboard/            KPIs, funnel, charts, shared dashboard widgets
    whatsapp/             Connection, QR/link, AI chatbot demo, lead inbox
    call-agent/            Call queue, live-call UI, meeting booking
    leads/                 Kanban, table, lead profile drawer
    inbox/, comments/      Social inbox and comment moderation
    automations/           Automation builder + test-run simulator
    ai/                    AI Assistant + Knowledge Base
    settings/              Workspace, team, WhatsApp, Call Agent, Sheets, usage
    ui/                    shadcn/ui primitives
  lib/
    data/                  Deterministic seeded mock datasets
    integrations/          Real-vs-simulated seams: whatsapp, calling, calendar,
                            sheets, ai — each documents exactly what a real
                            integration would need
    leads/                 Lead scoring logic (modular, replaceable by a real model)
    services/               Async service functions (dashboard, AI assistant)
    store/                  Client-side in-memory stores (React context) per domain
    auth/                   Mock session/auth
  types/                   Shared domain types for the whole product
```

## Future roadmap

Real integrations planned but not yet built:
- WhatsApp Business Cloud API (official Meta integration — the recommended next step)
- A real LLM provider for the AI chatbot, Call Agent, and AI Assistant
- Real telephony (e.g. Twilio) + STT/TTS for the AI Call Agent
- Google Calendar API for real meeting booking
- Google Sheets API for real lead export
- A real database and authentication provider
- Real OAuth per social platform and a real publishing API
