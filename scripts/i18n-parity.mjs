#!/usr/bin/env node
// i18n parity check.
//
// `en` is the source of truth. Every other locale in messages/ must have
// exactly the same set of keys — no missing keys (silent English fallback),
// no extra keys (dead strings). Structural drift fails the build.
//
// Values still identical to English are reported as "untranslated" warnings.
// These do NOT fail the build: a freshly scaffolded locale is all-English by
// design, and the count is meant to be burned down via the TMS (Tolgee).
//
// Usage:
//   node scripts/i18n-parity.mjs            # warn on untranslated, fail on drift
//   node scripts/i18n-parity.mjs --strict   # also fail if anything is untranslated

import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const SOURCE_LOCALE = 'en'
const MESSAGES_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'messages')
const strict = process.argv.includes('--strict')

/** Flatten a nested messages object into a Map of dotted-path -> string value. */
function flatten(obj, prefix = '', out = new Map()) {
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      flatten(value, path, out)
    } else {
      out.set(path, value)
    }
  }
  return out
}

function loadLocale(locale) {
  const raw = readFileSync(join(MESSAGES_DIR, `${locale}.json`), 'utf8')
  return flatten(JSON.parse(raw))
}

const localeFiles = readdirSync(MESSAGES_DIR)
  .filter((f) => f.endsWith('.json'))
  .map((f) => f.slice(0, -'.json'.length))

if (!localeFiles.includes(SOURCE_LOCALE)) {
  console.error(`✗ Source locale "${SOURCE_LOCALE}.json" not found in messages/`)
  process.exit(1)
}

const source = loadLocale(SOURCE_LOCALE)
const targets = localeFiles.filter((l) => l !== SOURCE_LOCALE).sort()

let hasDrift = false
let hasUntranslated = false

console.log(`i18n parity — source: ${SOURCE_LOCALE} (${source.size} keys)\n`)

for (const locale of targets) {
  const target = loadLocale(locale)

  const missing = [...source.keys()].filter((k) => !target.has(k))
  const extra = [...target.keys()].filter((k) => !source.has(k))
  const untranslated = [...source.entries()]
    .filter(([k, v]) => target.has(k) && typeof v === 'string' && target.get(k) === v)
    .map(([k]) => k)

  const drift = missing.length > 0 || extra.length > 0
  if (drift) hasDrift = true
  if (untranslated.length > 0) hasUntranslated = true

  const icon = drift ? '✗' : '✓'
  console.log(
    `${icon} ${locale} — ${target.size} keys` +
      ` (${missing.length} missing, ${extra.length} extra, ${untranslated.length} untranslated)`
  )

  const preview = (label, keys) => {
    if (keys.length === 0) return
    console.log(`    ${label}:`)
    for (const k of keys.slice(0, 20)) console.log(`      ${k}`)
    if (keys.length > 20) console.log(`      … and ${keys.length - 20} more`)
  }

  preview('missing (in en, absent here)', missing)
  preview('extra (here, not in en)', extra)
  if (strict) preview('untranslated (identical to en)', untranslated)
  console.log()
}

if (hasDrift) {
  console.error('✗ Key drift detected. Locales must match en exactly.')
  process.exit(1)
}

if (strict && hasUntranslated) {
  console.error('✗ Untranslated strings found (--strict).')
  process.exit(1)
}

if (hasUntranslated) {
  console.log('⚠ Some strings are still untranslated (identical to en). Not failing.')
}

console.log('✓ All locales are structurally in parity with en.')
