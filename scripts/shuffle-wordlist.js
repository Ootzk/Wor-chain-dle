#!/usr/bin/env node

/**
 * Deterministic wordlist shuffler for Wor-chain-dle.
 *
 * Uses a seeded PRNG (mulberry32) + Fisher-Yates shuffle
 * so the result is always the same for a given seed.
 *
 * Usage:
 *   node scripts/shuffle-wordlist.js          # preview first 100
 *   node scripts/shuffle-wordlist.js --apply   # overwrite wordlist.ts
 */

const fs = require('fs')
const path = require('path')

const SEED = 20260216 // Wor-chain-dle launch date
const WORDLIST_PATH = path.join(__dirname, '../src/constants/wordlist.ts')

// mulberry32: simple seeded 32-bit PRNG
function mulberry32(seed) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Fisher-Yates shuffle with seeded RNG
function seededShuffle(array, seed) {
  const rng = mulberry32(seed)
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// Parse words from wordlist.ts
const content = fs.readFileSync(WORDLIST_PATH, 'utf-8')
const wordRegex = /^'([^']+)',?$/gm
const words = []
let match
while ((match = wordRegex.exec(content)) !== null) {
  words.push(match[1])
}

console.log(`Loaded ${words.length} words (seed: ${SEED})`)

const shuffled = seededShuffle(words, SEED)

// Preview
const previewCount = 100
console.log(`\nFirst ${previewCount} words after shuffle:`)
for (let i = 0; i < previewCount && i < shuffled.length; i++) {
  const num = String(i).padStart(4)
  process.stdout.write(`${num}: ${shuffled[i]}  `)
  if ((i + 1) % 5 === 0) process.stdout.write('\n')
}
console.log()

// Apply mode
if (process.argv.includes('--apply')) {
  const header = `import { CONFIG } from './config'\n\nexport const WORDS = [\n`
  const body = shuffled.map((w) => `'${w}',`).join('\n') + '\n'
  const footer = `]\n\nif (CONFIG.normalization) {\n  WORDS.forEach((val, i) => (WORDS[i] = val.normalize(CONFIG.normalization)))\n}\n`

  fs.writeFileSync(WORDLIST_PATH, header + body + footer, 'utf-8')
  console.log(`wordlist.ts updated with ${shuffled.length} shuffled words.`)
  console.log('Removed runtime shuffle logic (no longer needed).')
} else {
  console.log('Run with --apply to overwrite wordlist.ts')
}
