-- ═══════════════════════════════════════════════════════════════════════════
-- The Record — Supabase Schema v2
-- Run in your Supabase SQL Editor: https://supabase.com/dashboard
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Extensions ───────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── creator_applications ─────────────────────────────────────────────────────
-- Stores publisher applications from the /publish 3-step form.
-- Applications are reviewed manually; status flows: pending → approved | rejected

create table if not exists creator_applications (
  id                uuid primary key default uuid_generate_v4(),
  name              text not null,
  email             text not null,
  twitter_handle    text,
  country           text,
  creator_type      text not null,              -- e.g. "On-chain investigator"
  content_types     text[] not null default '{}', -- e.g. ["on-chain","investigation"]
  sample_url_1      text,
  sample_url_2      text,
  bio               text not null,
  content_plan      text not null,
  wallet_ready      text,                       -- their answer about crypto wallet
  status            text not null default 'pending', -- pending | approved | rejected
  reviewer_note     text,
  submitted_at      timestamptz not null default now(),
  reviewed_at       timestamptz,
  created_at        timestamptz not null default now()
);

-- Unique index on normalised email — one application per address
create unique index if not exists creator_applications_email_idx
  on creator_applications (lower(email));

-- ─── publishers ───────────────────────────────────────────────────────────────
-- Approved publishers. Created when an application is approved.

create table if not exists publishers (
  id                uuid primary key default uuid_generate_v4(),
  application_id    uuid references creator_applications(id),
  name              text not null,
  handle            text not null unique,
  aptos_address     text,                       -- wallet address (set when they connect)
  verified          boolean not null default false,
  content_types     text[] not null default '{}',
  bio               text,
  joined_at         timestamptz not null default now(),
  created_at        timestamptz not null default now()
);

-- ─── records (was: articles) ──────────────────────────────────────────────────
-- Every published record — on-chain content backed by Shelby blob.

create table if not exists records (
  id                uuid primary key default uuid_generate_v4(),
  slug              text not null unique,
  title             text not null,
  excerpt           text,
  content_type      text not null,              -- on-chain | investigation | journalism | science | legal | financial
  publisher_id      uuid references publishers(id),
  publisher_name    text not null,
  published_at      timestamptz not null default now(),
  tags              text[] not null default '{}',

  -- Shelby / Aptos proof
  blob_name         text,                       -- <address>/records/<slug>/<ts>
  aptos_tx_hash     text,
  content_hash      text,                       -- SHA-256 of blob bytes
  shelby_network    text not null default 'testnet',
  expires_at        timestamptz,               -- Shelby blob TTL
  renewed_at        timestamptz,

  -- Pricing
  price_view        numeric(10,2) not null default 5.00,
  price_cite        numeric(10,2) not null default 19.00,
  price_license     numeric(10,2) not null default 99.00,

  -- Stats (denormalised for performance)
  view_count        integer not null default 0,
  license_count     integer not null default 0,

  is_public         boolean not null default true,
  featured          boolean not null default false,
  created_at        timestamptz not null default now()
);

-- ─── source_documents ─────────────────────────────────────────────────────────

create table if not exists source_documents (
  id                uuid primary key default uuid_generate_v4(),
  record_id         uuid references records(id) on delete cascade,
  name              text not null,
  mime_type         text not null,
  blob_name         text not null,
  aptos_tx_hash     text,
  content_hash      text not null,
  size_kb           integer,
  expires_at        timestamptz,
  created_at        timestamptz not null default now()
);

-- ─── licenses ─────────────────────────────────────────────────────────────────
-- Tracks every license purchase.

create table if not exists licenses (
  id                uuid primary key default uuid_generate_v4(),
  record_id         uuid references records(id),
  buyer_address     text not null,             -- Aptos wallet address
  tier              text not null,             -- view | cite | license | institutional
  price_paid        numeric(10,2) not null,
  currency          text not null default 'USD',
  aptos_tx_hash     text,                      -- payment tx
  citation_id       text,                      -- set for cite tier
  citation_blob_name text,                     -- Shelby blob of citation package
  issued_at         timestamptz not null default now()
);

-- ─── citations ────────────────────────────────────────────────────────────────
-- On-chain citation packages issued for the Cite tier.

create table if not exists citations (
  id                uuid primary key default uuid_generate_v4(),
  citation_id       text not null unique,      -- hex ID from issueCitation()
  record_id         uuid references records(id),
  record_slug       text not null,
  citer_address     text not null,
  blob_name         text not null,             -- Shelby blob: <addr>/citations/<slug>/<id>.json
  aptos_tx_hash     text,
  content_hash      text,
  issued_at         timestamptz not null default now()
);

-- ─── Row Level Security ───────────────────────────────────────────────────────

alter table creator_applications enable row level security;
alter table publishers            enable row level security;
alter table records               enable row level security;
alter table source_documents      enable row level security;
alter table licenses              enable row level security;
alter table citations             enable row level security;

-- Public can read published records
create policy "Public read published records"
  on records for select
  using (is_public = true);

-- Public can read source docs of public records
create policy "Public read source docs"
  on source_documents for select
  using (
    exists (
      select 1 from records r
      where r.id = source_documents.record_id
      and r.is_public = true
    )
  );

-- Public can read publishers
create policy "Public read publishers"
  on publishers for select
  using (true);

-- Public can read citations (for verification)
create policy "Public read citations"
  on citations for select
  using (true);

-- Service role can do everything (used by API routes with SUPABASE_SERVICE_ROLE_KEY)
-- No additional policies needed — service role bypasses RLS

-- ─── Indexes ─────────────────────────────────────────────────────────────────

create index if not exists records_slug_idx          on records (slug);
create index if not exists records_content_type_idx  on records (content_type);
create index if not exists records_featured_idx      on records (featured) where featured = true;
create index if not exists records_expires_at_idx    on records (expires_at);
create index if not exists citations_citation_id_idx on citations (citation_id);
create index if not exists licenses_buyer_idx        on licenses (buyer_address);

-- ─── Done ─────────────────────────────────────────────────────────────────────
-- Run: supabase db push  OR paste into the SQL Editor
