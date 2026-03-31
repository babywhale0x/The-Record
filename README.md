# The Record

**Permanent. Verified. On-Chain.**

> A censorship-resistant knowledge archive for investigations, journalism, legal documents, research, and on-chain analysis — cryptographically committed to the Aptos blockchain via Shelby Protocol.

[![Live](https://img.shields.io/badge/live-therecord.vercel.app-orange)](https://therecord.vercel.app)
[![Network](https://img.shields.io/badge/network-Aptos%20Testnet-blue)](https://explorer.aptoslabs.com)
[![Storage](https://img.shields.io/badge/storage-Shelby%20Protocol-purple)](https://shelby.xyz)
[![License](https://img.shields.io/badge/license-BUSL%201.1-green)](#license)

---

## What Is The Record?

The Record is a permanent, verifiable, monetizable knowledge archive. Every record published on the platform is:

- **Uploaded to Shelby Protocol** — decentralised storage on the Aptos blockchain, distributed across thousands of nodes worldwide
- **Committed on-chain** — content hash and metadata permanently stored in a Move smart contract on Aptos testnet
- **Impossible to alter or delete** — once published, the record exists forever
- **Monetizable** — publishers set prices for four license tiers; readers pay in APT directly from their wallet

The platform is built for investigators, journalists, researchers, scientists, lawyers, and anyone with hard knowledge to share and protect.

---

## Six Content Types

| Type | Icon | Colour |
|------|------|--------|
| On-Chain | ⛓ | Purple `#7C3AED` |
| Investigation | 🔍 | Red `#C4401E` |
| Journalism | 📰 | Blue `#3B82F6` |
| Science | 🔬 | Green `#10B981` |
| Legal | ⚖️ | Amber `#F59E0B` |
| Financial | 📊 | Green `#22C55E` |

---

## Four License Tiers

| Tier | Description | Access |
|------|-------------|--------|
| **View** | 48-hour read-only access, watermarked | Platform viewer only, no download |
| **Cite** | Permanent citation rights | Signed citation certificate (APA, MLA, Chicago, Bluebook) |
| **License** | Full professional use | Download enabled, hard visible watermark |
| **Institutional** | Bulk + API access | Custom contract |

Publishers set all prices in APT. Platform takes 10%, publisher receives 90% — settled atomically in a single on-chain transaction via the Move smart contract.

---

## Architecture

```
Browser (Next.js 14)
    │
    ├── Shelby Protocol (Aptos Testnet)
    │   └── Decentralised blob storage
    │       ├── Article JSON blobs
    │       └── Source document blobs
    │
    ├── Aptos Blockchain (Testnet)
    │   └── record_registry Move module
    │       ├── register_record()
    │       ├── purchase_license()
    │       ├── has_license()
    │       └── get_stats()
    │
    ├── Supabase (Postgres)
    │   ├── records
    │   ├── source_documents
    │   ├── citations
    │   ├── publishers
    │   └── creator_applications
    │
    └── Vercel (Hosting)
        └── Next.js API Routes
            ├── /api/publish
            ├── /api/stream
            ├── /api/balance
            ├── /api/feed
            ├── /api/citation
            ├── /api/ai/search
            └── /api/admin/*
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14.2.5 (App Router) |
| Styling | CSS Modules (dark theme) |
| Blockchain | Aptos Testnet |
| Smart Contract | Move — `record_registry` module |
| Decentralised Storage | Shelby Protocol SDK |
| Database | Supabase (Postgres) |
| Wallet | `@aptos-labs/wallet-adapter-react` v4 — Petra, Martian, and others |
| AI Search | Claude (Anthropic API) |
| Hosting | Vercel |

---

## Five-Tab Navigation

| Tab | Route | Description |
|-----|-------|-------------|
| **Home** | `/` | Discovery feed, featured and recent records, content type filters |
| **Feed** | `/feed` | Full feed with type filters, live from Supabase |
| **AI** | `/ai` | Semantic search + Ask the Archive (Claude-powered) |
| **Publish** | `/publish` | Publisher application form; approved wallets redirect to dashboard |
| **Wallet** | `/wallet` | Live APT balance, transaction history, published records |

---

## Key Features

### Publisher Flow
1. Apply at `/publish` — 3-step application form with wallet capture
2. Admin reviews at `/admin` — approve or reject with single click
3. Approved wallet redirects to `/dashboard`
4. Publisher uploads article + source documents from the dashboard
5. Browser wallet signs two transactions — one per file — directly to Shelby
6. Article registered on-chain via `register_record()` smart contract call
7. Receipt saved to Supabase

### Reader / Unlock Flow
1. Reader visits a record page
2. If they have a cached license (localStorage), content unlocks instantly
3. Otherwise they select a tier and pay via wallet
4. `purchase_license()` smart contract executes atomic 90/10 split
5. Content fetched from Shelby and decrypted in browser
6. License cached locally — View tier expires after 48h, Cite/License are permanent

### Citation Flow
When a reader purchases the **Cite** or **License** tier, a signed citation certificate is generated containing:
- Unique Citation ID (e.g. `CR-A3F9B2C14D8E`)
- APA, MLA, Chicago, and Bluebook (legal) formatted citations
- On-chain proof: content hash + license TX hash
- Public verification URL at `/verify/{citationId}`
- Downloadable as `.txt` or `.json`

### Watermarking
Every unlocked document receives two layers of watermarking:
- **Invisible** — reader's wallet address encoded as zero-width Unicode characters between words; survives copy-paste; forensically extractable
- **Visual** — subtle diagonal overlay showing truncated wallet + citation ID at low opacity

### AI Search Tab
Two modes powered by Claude:
- **Search Archive** — describe what you're looking for in plain language; returns ranked matches with relevance explanations and match scores
- **Ask the Archive** — conversational interface; Claude answers questions using published records as context

---

## Smart Contract

**Module:** `0xa8c20d49b063e41aff19123fd2263d0b9945ec9708ce9d7ec72d68f485043cb8::record_registry`

**Network:** Aptos Testnet

**Entry functions:**
- `initialize(platform)` — deploy registry (run once)
- `register_record(publisher, platform_addr, slug, content_hash, blob_name, price_view, price_cite, price_license)` — register record on-chain
- `purchase_license(buyer, platform_addr, record_slug, tier)` — atomic payment split

**View functions:**
- `get_record(platform_addr, slug)` — returns content hash, publisher, prices, active status
- `has_license(platform_addr, user_addr, slug, min_tier)` — verify license on-chain
- `get_stats(platform_addr)` — total records, licenses, volume

[View on Aptos Explorer →](https://explorer.aptoslabs.com/account/0xa8c20d49b063e41aff19123fd2263d0b9945ec9708ce9d7ec72d68f485043cb8/modules/code/record_registry?network=testnet)

---

## Environment Variables

```env
# Aptos / Shelby
APTOS_PRIVATE_KEY=ed25519-priv-0x...
APTOS_ACCOUNT_ADDRESS=0xa8c20d49b063e41aff19123fd2263d0b9945ec9708ce9d7ec72d68f485043cb8
SHELBY_API_KEY=aptoslabs_...
SHELBY_NETWORK=testnet
NEXT_PUBLIC_APTOS_API_KEY=AG-...
NEXT_PUBLIC_PLATFORM_ADDRESS=0xa8c20d49b063e41aff19123fd2263d0b9945ec9708ce9d7ec72d68f485043cb8
NEXT_PUBLIC_SHELBY_NETWORK=testnet

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://...supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# AI
ANTHROPIC_API_KEY=sk-ant-...

# Admin
ADMIN_PASSWORD=...
CRON_SECRET=...
```

---

## Project Structure

```
the-record/
├── app/
│   ├── page.tsx              # Home
│   ├── feed/                 # Feed
│   ├── ai/                   # AI search
│   ├── publish/              # Application form
│   ├── dashboard/            # Publisher dashboard
│   ├── admin/                # Admin panel
│   ├── records/[slug]/       # Record viewer
│   ├── verify/[id]/          # Citation verification
│   └── api/
│       ├── publish/          # Save record to Supabase
│       ├── feed/             # Public record feed
│       ├── records/[slug]/   # Single record fetch
│       ├── stream/[...path]/ # Shelby blob proxy
│       ├── balance/          # APT balance
│       ├── citation/         # Citation generation + verification
│       ├── ai/search/        # Claude-powered search
│       └── admin/            # Admin operations
├── components/
│   ├── layout/               # TopBar, BottomNav
│   ├── ui/                   # RecordCard, ContentTypeBadge, CitationModal, WatermarkedViewer
│   └── wallet/               # AptosProvider, WalletModal
├── lib/
│   ├── shelby.ts             # Server-side Shelby SDK
│   ├── shelby-browser.ts     # Browser-side upload
│   ├── contract.ts           # Smart contract integration
│   ├── watermark.ts          # Invisible + visual watermarking
│   ├── licenseCache.ts       # localStorage license cache
│   ├── supabase.ts           # Supabase client
│   └── content-types.ts      # Content type definitions
├── contracts/
│   ├── Move.toml
│   ├── deploy.sh
│   └── sources/
│       └── record_registry.move
└── styles/
    └── globals.css
```

---

## Supabase Schema

| Table | Purpose |
|-------|---------|
| `records` | Published records with metadata, pricing, blob references |
| `source_documents` | Documents attached to records |
| `citations` | Citation certificates issued to licensees |
| `publishers` | Approved publisher wallets |
| `creator_applications` | Pending publisher applications |

---

## Deployment

The app deploys automatically to Vercel on push to `main`.

**Manual deploy:**
```bash
npx vercel --prod
```

**Contract deployment:**
```bash
cd contracts
aptos move compile --named-addresses the_record=<address>,platform=<address>
aptos move publish --named-addresses the_record=<address>,platform=<address> --profile testnet --assume-yes
aptos move run --function-id "<address>::record_registry::initialize" --profile testnet --assume-yes
```

---

## Roadmap

- [x] Publish flow — browser wallet signs directly to Shelby
- [x] Smart contract — atomic license purchase with 90/10 split
- [x] Citation certificates — APA, MLA, Chicago, Bluebook
- [x] Invisible + visual watermarking
- [x] License cache — no re-payment on revisit
- [x] AI semantic search + Ask the Archive
- [x] Wallet tab — live balance, transactions
- [ ] Bunny CDN — edge caching for faster delivery
- [ ] IPFS mirror — additional censorship resistance layer
- [ ] Tor .onion mirror
- [ ] Fiat onramp — card payments via Stripe
- [ ] Subscription tier — recurring payments
- [ ] Mobile app

---

## License

Business Source License 1.1 (BUSL 1.1). See [LICENSE](./LICENSE) for full terms.

---

*The Record — Permanent. Verified. On-Chain.*
