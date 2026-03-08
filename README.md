# The Record

> Censorship-resistant investigative journalism and government document archive for Nigeria and West Africa — built on Shelby Protocol (Aptos blockchain).

Every article stored permanently. Every source document hash-committed on-chain. Every payment wallet-to-wallet. No platform can take it down.

---

## What it is

Independent journalists in Nigeria face payment processor blocks, government takedowns, and editorial interference. The Record is infrastructure that removes all three attack surfaces:

- **Articles + source documents** stored as blobs on Shelby Protocol (decentralised storage on Aptos)
- **Cryptographic hash** of every article committed to Aptos at publish time — any future alteration is immediately detectable
- **Direct wallet-to-wallet payments** — readers pay journalists directly; no bank, no processor, no middleman
- **Dead man's switch** — time-locked article releases via Aptos smart contract
- **Background archive** — automatic scraper pipeline for INEC, BPP, EFCC, NASS, CBN, NJC public documents
- **Two-sided publishing** — journalists choose public or private per article; private articles are end-to-end encrypted

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 14 (App Router) | RSC for performance, API routes for server-side Shelby calls |
| Language | TypeScript | Full end-to-end type safety |
| Styling | CSS Modules (no Tailwind) | Full design control, no compiler dependency |
| Storage | Shelby Protocol | Decentralised blob storage on Aptos, ~$0.01/GB/month |
| Chain | Aptos | Shelby's native chain; fast, cheap |
| Fonts | Playfair Display · DM Sans · DM Mono | Editorial feel |

---

## Project Structure

```
the-record/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                          # Landing page
│   ├── apply/page.tsx                    # /apply
│   ├── dashboard/page.tsx                # /dashboard
│   ├── investigations/
│   │   ├── page.tsx                      # /investigations
│   │   └── [slug]/page.tsx               # /investigations/:slug
│   └── api/
│       ├── publish/route.ts
│       ├── verify/route.ts
│       └── balance/route.ts
├── components/
│   ├── layout/          # AnnouncementBar, Nav, Footer
│   ├── sections/        # Landing page sections
│   ├── dashboard/       # DashboardShell, Nav, Home, ArticleEditor
│   ├── investigations/  # InvestigationsFeed, ArticlePage
│   └── ui/              # SectionHeader, DocumentMockup
├── lib/
│   ├── shelby.ts        # Shelby Protocol + Aptos integration
│   ├── shelby-client.ts # Browser-safe API wrapper
│   ├── investigations.ts
│   └── env.d.ts
├── styles/globals.css
└── .env.example
```

---

## Getting Started

```bash
git clone https://github.com/YOUR_USERNAME/the-record.git
cd the-record
npm install
cp .env.example .env.local   # fill in your Shelby + Aptos keys
npm run dev
```

To get your keys:
```bash
npm i -g @shelby-protocol/cli
shelby init
shelby faucet --network testnet
shelby account list
```

Copy `private_key` and `address` from `~/.shelby/config.yaml` into `.env.local`.

---

## Build Status

### ✅ Complete

| Feature | Notes |
|---|---|
| Landing page | All sections: Hero, HowItWorks, ForJournalists, ForReaders, ArchiveSection, BuiltOn, CTA |
| `/apply` — journalist application | 3-step form with validation + success state |
| `/dashboard` — editor + publish UI | 4-tab editor with simulated Shelby publish flow |
| `/investigations` — feed + article reader | Filterable feed, paywall, source doc verification UI |
| `lib/shelby.ts` — Shelby + Aptos integration | Upload, retrieve, verify, balance, renewal |
| API routes | `/api/publish`, `/api/verify`, `/api/balance` |
| BUSL 1.1 License | Code is public but commercially protected |

---

### ⏳ Pending — Privacy & Identity Layer

These features are the next engineering priority. They address the real threat model for journalists operating in Nigeria.

#### P1 — Pseudonymous Publishing
- Journalists publish under a pen name (chosen at wallet creation), not their real name
- Real identity is held only in a sealed, offline-encrypted editorial register — never in the database
- The platform never links a wallet address to a real person publicly

#### P2 — Stealth Wallet Addresses (per-article)
- Each article is published from a **one-time derived address**, not the journalist's main wallet
- Prevents chain-tracing: a reader or government actor cannot look up a journalist's wallet and see all their articles, earnings, or identity
- The journalist controls all derived addresses from one master key — they don't manage multiple wallets
- Critical for physical safety: a journalist with ₦2m in on-chain earnings from a corruption piece is a target

#### P3 — Two-Sided Publishing (Public vs Private)
- **Public** — article visible to all readers on `/investigations`; content stored unencrypted on Shelby; Aptos hash is public
- **Private** — article visible only to wallet-holders who have been granted access; content is **end-to-end encrypted** before it leaves the browser using the reader's Aptos public key; even Shelby storage providers cannot read it
- Journalist chooses Public or Private per article in the editor Settings tab
- Private articles can be shared with: specific wallets (named sources, editors, lawyers), paid subscribers only, or embargoed until a date (dead man's switch)
- Private does not mean hidden from the archive — the hash and timestamp are still committed on-chain; only the content is encrypted

#### P4 — Journalist Privacy Controls (Dashboard)
- Toggle: show/hide real name on published articles
- Toggle: show/hide wallet address on published articles
- Option to publish fully anonymously (no name, no address — just the on-chain proof)
- Manage which wallets have access to private articles
- Revoke access to private articles (re-encrypt with new key set, old key invalidated)

#### P5 — Source Submission Portal (Anonymous)
- Separate `/submit` route for anonymous sources to submit documents
- Tor-accessible — no IP logged, no cookies
- End-to-end encrypted upload direct to journalist's Shelby inbox
- Source never needs a wallet — they submit via a journalist's public submission link
- Journalist's submission link is a derived key, not their main address

#### P6 — Minimal Data Collection
- Strip real name, Twitter handle, city from the apply form — editorial verification happens off-platform
- No analytics, no tracking, no third-party scripts
- All auth is wallet-signature based — no email/password database to breach

---

### ⏳ Pending — Infrastructure

| Feature | Notes |
|---|---|
| Government archive scraper | Node.js + Playwright; INEC, BPP, EFCC, NASS, CBN first |
| Real wallet auth | Aptos wallet connect (Petra, Martian) replacing mock Bearer token |
| Smart contract | Dead man's switch, hash commitment, access control for private articles |
| Blob renewal cron | Auto-renew Shelby blobs before expiry |
| IPFS/Fleek mirror | Censorship-resistant frontend deployment (survives domain seizure) |
| `/archive` search UI | Full-text search across all archived government documents |
| `/verify` page | Public tool — paste any Aptos tx hash, verify document integrity |
| `/about`, `/pricing` pages | |
| `.onion` mirror | Tor hidden service for the full platform |

---

## Privacy Architecture (Design Intent)

```
Journalist's real identity
        │
        │  never stored on platform
        ▼
  Pen name + Master Aptos key
        │
        ├──► Article 1 → derived address A → Shelby blob → Aptos tx
        ├──► Article 2 → derived address B → Shelby blob → Aptos tx
        └──► Article 3 → derived address C → Shelby blob → Aptos tx (PRIVATE: encrypted)

Reader wanting private article:
  Reader wallet pubkey → journalist encrypts blob → only reader's privkey can decrypt
```

No single point of failure. No database of journalist identities. No traceable wallet history.

---

## Grants

Targeting: Aptos Foundation · CPJ · Freedom of the Press Foundation · Mozilla Foundation · Open Society Foundations

---

## License

Business Source License 1.1 — see [LICENSE](./LICENSE).
Code is publicly readable and auditable. Commercial use requires permission.
Converts to MIT on 2030-01-01.

---

Built on [Shelby Protocol](https://shelby.xyz) · [Aptos](https://aptos.dev) · [Next.js](https://nextjs.org)
