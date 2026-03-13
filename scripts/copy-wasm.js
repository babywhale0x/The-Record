// Copies clay.wasm into the public directory so Vercel can serve it,
// AND into the dist folder path the SDK expects at runtime.
const fs = require('fs')
const path = require('path')

const src = path.join(__dirname, '../node_modules/@shelby-protocol/clay-codes/dist/clay.wasm')

if (!fs.existsSync(src)) {
  console.log('[copy-wasm] clay.wasm not found at', src, '- skipping')
  process.exit(0)
}

// Copy to public so it's always accessible
const publicDest = path.join(__dirname, '../public/clay.wasm')
fs.copyFileSync(src, publicDest)
console.log('[copy-wasm] Copied to public/clay.wasm')
