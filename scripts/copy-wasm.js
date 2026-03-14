const fs = require('fs')
const path = require('path')

try {
  const src = path.join(__dirname, '../node_modules/@shelby-protocol/clay-codes/dist/clay.wasm')
  const destDir = path.join(__dirname, '../public')
  const dest = path.join(destDir, 'clay.wasm')

  if (!fs.existsSync(src)) {
    console.log('[copy-wasm] clay.wasm not found - skipping')
    process.exit(0)
  }

  // Ensure public directory exists
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true })
  }

  fs.copyFileSync(src, dest)
  console.log('[copy-wasm] Copied to public/clay.wasm')
} catch (err) {
  console.log('[copy-wasm] Skipping:', err.message)
  process.exit(0)
}
