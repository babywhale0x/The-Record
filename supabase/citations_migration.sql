create table if not exists citations (
  id uuid default gen_random_uuid() primary key,
  citation_id text unique not null,
  record_id uuid references records(id) on delete cascade,
  licensee_address text not null,
  license_tx_hash text,
  tier text not null default 'cite',
  issued_at timestamptz not null default now(),
  package_hash text,
  created_at timestamptz default now()
);

create index if not exists citations_citation_id_idx on citations(citation_id);
create index if not exists citations_licensee_idx on citations(licensee_address);
create index if not exists citations_record_idx on citations(record_id);
