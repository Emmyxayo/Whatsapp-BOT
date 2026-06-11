-- Run this in Supabase: SQL Editor -> New query -> paste -> Run.
-- Multi-tenant model: one platform, many regions, each region has organizations,
-- each organization has its own WhatsApp number + its own editable content.

create table if not exists regions (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_at  timestamptz default now()
);

create table if not exists organizations (
  id                      uuid primary key default gen_random_uuid(),
  region_id               uuid references regions(id) on delete cascade,
  name                    text not null,
  -- Meta's phone_number_id for this organization's WhatsApp number.
  -- Incoming messages are routed to the right organization by matching this.
  whatsapp_phone_number_id text unique not null,
  whatsapp_display_number  text,
  subscription_status      text default 'trial',   -- trial | active | past_due | cancelled
  paystack_customer_code   text,
  -- Links this organization to its Supabase Auth login (set during onboarding).
  auth_user_id             uuid,
  created_at               timestamptz default now()
);

-- The single thing members/customers pull. Admin edits this whenever info changes.
create table if not exists org_updates (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  label           text,                 -- e.g. "Opening hours" or "This week"
  body            text,                 -- the main update / announcements
  key_details     text,                 -- e.g. hours, schedule, service times
  contact         text,                 -- address, contact, anything else
  updated_at      timestamptz default now()
);

create table if not exists faqs (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  question        text not null,
  answer          text not null
);

-- Log every exchange so you can show usage and bill confidently.
create table if not exists conversations (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete set null,
  member_wa_id    text,                  -- the member's WhatsApp number (hashed in prod ideally)
  message_in      text,
  message_out     text,
  created_at      timestamptz default now()
);

create index if not exists idx_org_updates_org on org_updates(organization_id);
create index if not exists idx_faqs_org on faqs(organization_id);
create index if not exists idx_conversations_org on conversations(organization_id);

-- ---- Seed one organization so you can test immediately ----
-- After you have a real WhatsApp phone_number_id, replace 'TEST_PHONE_NUMBER_ID'.
insert into regions (id, name)
  values ('11111111-1111-1111-1111-111111111111', 'Lagos Region 1')
  on conflict do nothing;

insert into organizations (region_id, name, whatsapp_phone_number_id, whatsapp_display_number)
  values ('11111111-1111-1111-1111-111111111111', 'Test Organization', 'TEST_PHONE_NUMBER_ID', '+234...')
  on conflict (whatsapp_phone_number_id) do nothing;
