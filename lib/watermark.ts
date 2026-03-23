/**
 * lib/watermark.ts
 * Invisible and visible watermarking for The Record
 * 
 * Invisible: Zero-width unicode characters encode the reader's wallet address
 * between words in the document text. Survives copy-paste, invisible to naked eye.
 * 
 * Visual: Subtle overlay showing truncated wallet + citation ID
 */

// Zero-width characters used for encoding
const ZW_ZERO = '\u200B' // Zero-width space = 0
const ZW_ONE  = '\u200C' // Zero-width non-joiner = 1
const ZW_SEP  = '\u200D' // Zero-width joiner = separator

/**
 * Encode a string as binary using zero-width characters
 */
function encodeToBinary(text: string): string {
  return text
    .split('')
    .map(char => {
      const binary = char.charCodeAt(0).toString(2).padStart(8, '0')
      return binary.split('').map(bit => bit === '0' ? ZW_ZERO : ZW_ONE).join('')
    })
    .join(ZW_SEP)
}

/**
 * Decode zero-width characters back to string
 */
function decodeFromBinary(text: string): string {
  // Extract only zero-width characters
  const zwChars = text.split('').filter(c => [ZW_ZERO, ZW_ONE, ZW_SEP].includes(c))
  if (zwChars.length === 0) return ''
  
  const groups = zwChars.join('').split(ZW_SEP)
  return groups.map(group => {
    const binary = group.split('').map(c => c === ZW_ONE ? '1' : '0').join('')
    if (binary.length !== 8) return ''
    return String.fromCharCode(parseInt(binary, 2))
  }).join('')
}

/**
 * Embed invisible watermark into text
 * Distributes encoded wallet address throughout the document
 */
export function embedInvisibleWatermark(text: string, walletAddress: string, citationId: string): string {
  const payload = `WM:${walletAddress.slice(0, 16)}:${citationId}`
  const encoded = encodeToBinary(payload)
  
  // Split encoded into chunks and distribute between words
  const words = text.split(' ')
  if (words.length < 4) return text + encoded // Short text — append at end
  
  const chunkSize = Math.ceil(encoded.length / Math.min(words.length - 1, 20))
  const chunks: string[] = []
  for (let i = 0; i < encoded.length; i += chunkSize) {
    chunks.push(encoded.slice(i, i + chunkSize))
  }
  
  // Insert chunks between words at regular intervals
  const interval = Math.max(1, Math.floor(words.length / chunks.length))
  const result = [...words]
  
  chunks.forEach((chunk, i) => {
    const pos = Math.min(i * interval + 1, result.length - 1)
    result[pos] = result[pos] + chunk
  })
  
  return result.join(' ')
}

/**
 * Extract watermark from text (for forensic analysis)
 */
export function extractWatermark(text: string): string | null {
  try {
    const decoded = decodeFromBinary(text)
    if (decoded.startsWith('WM:')) return decoded
    return null
  } catch {
    return null
  }
}

/**
 * Apply watermark to full body text — handles paragraphs
 */
export function watermarkBody(body: string, walletAddress: string, citationId: string): string {
  const paragraphs = body.split('\n\n')
  
  // Only watermark the first few paragraphs to avoid obvious patterns
  return paragraphs.map((para, i) => {
    if (i === 0 && para.trim().length > 50) {
      return embedInvisibleWatermark(para, walletAddress, citationId)
    }
    if (i === 2 && para.trim().length > 50) {
      return embedInvisibleWatermark(para, walletAddress, `${citationId}-2`)
    }
    return para
  }).join('\n\n')
}

/**
 * Generate visual watermark text overlay
 */
export function getVisualWatermark(walletAddress: string, citationId: string): string {
  const shortWallet = `${walletAddress.slice(0, 8)}…${walletAddress.slice(-4)}`
  return `${shortWallet} · ${citationId} · The Record`
}
