const fs = require('fs')
const path = require('path')

const src = path.join(__dirname, '../node_modules/@shelby-protocol/clay-codes/dist/clay.wasm')
const dest = path.join(__dirname, '../public/clay.wasm')

if (!fs.existsSync(src)) {
  console.log('[copy-wasm] clay.wasm not found - skipping')
  process.exit(0)
}

fs.copyFileSync(src, dest)
console.log('[copy-wasm] Copied to public/clay.wasm')
