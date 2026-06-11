# Organization WhatsApp Bot Platform — starter

A multi-tenant platform where an organization's members and customers text a
WhatsApp number and a Claude-powered bot replies with that organization's latest
info. Built around the **pull model**: people message first, the bot replies
inside WhatsApp's free 24-hour window — so messaging stays free and your only
real cost is a few Claude tokens per reply.

## What's already here

- **Multi-tenant**: one codebase serves many regions/organizations. An
  organization is just a row; its content lives in the database, so a new
  organization = new row, no code.
- **The bot loop** (`src/app/api/whatsapp/route.ts`): someone texts in → routed
  to the right organization by its WhatsApp number → loads that organization's
  updates + FAQs → Claude writes a reply → sent back via the Cloud API → logged.
- **Task-specific & Meta-compliant**: the bot is scoped to "answer members and
  customers about this organization," not an open chatbot.
- **Payments stub** (`src/app/api/paystack/webhook/route.ts`): flips an
  organization to `active` on successful payment.

## One-time setup (about 30–45 min)

1. **Get the code into your environment.** Locally (recommended): unzip, then
   `git init && git add . && git commit -m "start"` and push to a new GitHub
   repo. Open the folder in your terminal (or Claude Code).
2. **Install:** `npm install` (needs Node.js 18+).
3. **Supabase** (free): create a project, open SQL Editor, paste
   `supabase/schema.sql`, Run. Copy your project URL + service role key.
4. **Anthropic:** create an API key at console.anthropic.com. (This is the only
   usage cost while building — a few dollars of testing.)
5. **WhatsApp Cloud API:** at developers.facebook.com create an app → add
   WhatsApp → get a test number, its `phone_number_id`, and an access token.
   Put that `phone_number_id` into the seeded organization row (replace
   `TEST_PHONE_NUMBER_ID` in the DB).
6. **Copy `.env.example` to `.env.local`** and fill in every value. Invent any
   string for `WHATSAPP_VERIFY_TOKEN`.
7. **Run it:** `npm run dev`, open http://localhost:3000.

## Connect the webhook

WhatsApp must reach a public URL. Two options:
- **For local testing:** run `npx ngrok http 3000` to get a public URL.
- **For real:** push to GitHub and deploy on **Vercel** (free) — one import,
  add the same env vars, done. Use the Vercel URL.

Then in Meta → WhatsApp → Configuration → Webhook:
- Callback URL: `https://YOUR-URL/api/whatsapp`
- Verify token: the same string you put in `WHATSAPP_VERIFY_TOKEN`
- Subscribe to the **messages** field.

Add an update for your test organization (insert an `org_updates` row), then
text "hi" from your phone to the test number. The bot should reply.

## Member & customer access

Each organization shares a click-to-chat link: `https://wa.me/<number>?text=hi`
(taps open WhatsApp with "hi" prefilled), plus a QR code for flyers/screens.

## Build roadmap (do these with Claude Code, in order)

1. **Admin dashboard** — login + a form for each organization to edit its
   update, key details, and FAQs. (Biggest next piece. Use Supabase Auth.)
2. **Onboarding** — region/organization signup, attach a WhatsApp number,
   generate the wa.me link + QR automatically.
3. **Paystack checkout** — subscription start, pass `organization_id` in metadata
   so the webhook can match it.
4. **Usage view** — read the `conversations` table to show each organization its
   monthly message count (and your Claude cost).
5. **Prompt caching** — cache the system prompt to push Claude cost toward the
   low end (see the profit calculator).

## Cost reality

- $0 to run idle. WhatsApp replies in the 24h window: free.
- Per-reply cost: a fraction of a naira on Haiku.
- Rule that keeps it free: **the bot only ever responds; it never broadcasts
  unprompted.** Outbound broadcasts are billed per message — keep those out of
  the base product or fund them separately (prepaid credits / the organization's
  own Meta billing).
