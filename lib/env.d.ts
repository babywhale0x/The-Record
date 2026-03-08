// Type augmentation for process.env
declare namespace NodeJS {
  interface ProcessEnv {
    // ── Shelby Protocol ──────────────────────────────────────────
    SHELBY_RPC_ENDPOINT: string          // e.g. https://api.testnet.shelby.xyz/shelby
    SHELBY_NETWORK: 'testnet' | 'shelbynet' | 'local'
    SHELBY_API_KEY?: string              // Optional — avoids rate limits

    // ── Aptos / Account ──────────────────────────────────────────
    APTOS_PRIVATE_KEY: string            // ed25519-priv-0x...
    APTOS_ACCOUNT_ADDRESS: string        // 0xfcba...
    APTOS_FULLNODE_URL: string           // e.g. https://api.testnet.aptoslabs.com/v1

    // ── App ──────────────────────────────────────────────────────
    NEXT_PUBLIC_SHELBY_NETWORK: string   // Exposed to browser for explorer links
    NEXT_PUBLIC_APTOS_EXPLORER_BASE: string
    NEXT_PUBLIC_SHELBY_EXPLORER_BASE: string
  }
}
