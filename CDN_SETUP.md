# CDN Setup Guide — The Record × Bunny CDN

Setting up a CDN in front of Shelby means:
- First read of any blob goes to Shelby (costs ~$0.014/GB)
- All subsequent reads are served from Bunny CDN edge nodes globally
- Dramatically improves latency for West Africa and other regions far from Shelby's data centres

---

## 1. Create a Bunny CDN account

→ https://dash.bunny.net

## 2. Create a Pull Zone

1. Go to **Pull Zones → Add Pull Zone**
2. Name it: `the-record-shelby`
3. Set **Origin URL** to your Shelby RPC:
   - Testnet: `https://api.testnet.shelby.xyz/shelby`
   - Shelbynet: `https://api.shelbynet.shelby.xyz/shelby`
4. Save

## 3. Attach your Geomi API key

Bunny CDN needs to authenticate with Shelby when it fetches from origin.

1. Go to your Pull Zone → **Security → S3 Authentication**
2. Paste your Geomi API key into both "AWS Key" and "AWS Secret" fields
3. Set "AWS Region" to: `geomi`
4. Save

## 4. Configure settings

- **Caching → Cache expiration time**: 30 days
  (Shelby blobs are immutable — safe to cache long-term)
- **Security → Block POST requests**: Enable
  (CDN is read-only; writes always go direct to Shelby)
- **Caching → Optimize for large object delivery**: Enable
- **WebSockets**: Disable

## 5. Note your CDN URL

It looks like: `https://the-record-shelby.b-cdn.net`

**Important**: The `/shelby` prefix is dropped by Bunny.
- Shelby URL: `https://api.testnet.shelby.xyz/shelby/v1/blobs/0xabc.../records/lazarus/123`
- CDN URL:    `https://the-record-shelby.b-cdn.net/v1/blobs/0xabc.../records/lazarus/123`

## 6. Add to your Vercel environment variables

```
SHELBY_CDN_URL=https://the-record-shelby.b-cdn.net
```

The app automatically uses the CDN for reads and direct Shelby for writes.

## 7. Verify it's working

After the first request, check the response headers for:
```
cdn-cache: HIT
```

If you see `MISS`, the CDN fetched from Shelby origin (normal for first request).
`HIT` means Bunny is serving from cache — no Shelby cost on that read.

---

## Cost estimate

| Scenario | Cost |
|---|---|
| 1,000 reads × 500KB doc | $0.007 via Shelby, ~$0 via CDN after first |
| Popular record (10,000 reads) | ~$0.07 first fetch, then CDN |
| Monthly CDN bandwidth (100GB) | ~$1 with Bunny |

The CDN pays for itself very quickly once any record gets more than a handful of reads.
