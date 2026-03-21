/**
 * Gemini client for "Trending Topics" idea exploration.
 *
 * Expects `GEMINI_API_KEY` in environment variables.
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

function normalizeText(s) {
  return String(s || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

function dedupeStrings(items) {
  const seen = new Set();
  const out = [];
  for (const raw of items || []) {
    const v = String(raw || '').trim();
    if (!v) continue;
    if (v === '[' || v === ']' || v === '[]') continue;
    const k = normalizeText(v);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(v);
  }
  return out;
}

function extractJsonArrayFromText(text) {
  const raw = String(text || '').trim();
  if (!raw) return null;

  // Remove common code fences.
  let cleaned = raw.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();

  // Try to parse an array-like JSON segment first.
  const firstArrayStart = cleaned.indexOf('[');
  const lastArrayEnd = cleaned.lastIndexOf(']');
  if (firstArrayStart !== -1 && lastArrayEnd !== -1 && lastArrayEnd > firstArrayStart) {
    const arraySegment = cleaned.slice(firstArrayStart, lastArrayEnd + 1);
    try {
      const parsed = JSON.parse(arraySegment);
      if (Array.isArray(parsed)) return parsed;
    } catch (_) {
      // Continue to fallback parsing below.
    }
  }

  // Fallback 1: extract quoted strings.
  const doubleQuoted = [];
  const m1 = cleaned.matchAll(/"([^"]+)"/g);
  for (const m of m1) doubleQuoted.push(m[1].trim());
  if (doubleQuoted.length >= 5) return doubleQuoted;

  const singleQuoted = [];
  const m2 = cleaned.matchAll(/'([^']+)'/g);
  for (const m of m2) singleQuoted.push(m[1].trim());
  if (singleQuoted.length >= 5) return singleQuoted;

  // Fallback 2: extract bullet/numbered lines (supports `[1. ...]` too).
  // First, handle numbered lists that may have been flattened into a single line.
  const singleLine = cleaned.replace(/\r?\n/g, ' ');
  const numberedItems = [];
  const m3 = singleLine.matchAll(/\b\d+\s*[\.)-]\s*(.+?)(?=(?:\s*\b\d+\s*[\.)-]\s*)|$)/g);
  for (const m of m3) numberedItems.push(m[1].trim());
  if (numberedItems.length >= 5) return numberedItems;

  const normalized = cleaned
    .replace(/^\s*\[/, '') // remove leading '['
    .replace(/\]\s*$/, '') // remove trailing ']'
    .replace(/^[\s,]+|[\s,]+$/g, '');

  const lines = normalized
    .split(/\r?\n/g)
    .map((l) => l.trim())
    .filter(Boolean);

  const items = [];
  for (const line of lines) {
    let s = line;
    // Remove any leading list marker (including cases like `1.` or `-` after `[`).
    s = s.replace(/^[-*]\s+/, '');
    s = s.replace(/^\[?\s*\d+\s*[\.)-]\s+/, ''); // matches `1.` / `1)` / `1-` etc, with optional '['
    s = s.replace(/^[\s\[\]]+/, '');
    s = s.replace(/^["'`]+|["'`]+$/g, '');
    if (!s || s === '[' || s === ']' || s === '[]') continue;
    // Strip trailing commas/semicolons that might trail list formatting.
    s = s.replace(/[;,]\s*$/, '').trim();
    if (s) items.push(s);
  }

  return items.length ? items : null;
}

async function callGeminiGenerateContent({ prompt }) {
  if (!GEMINI_API_KEY) {
    const err = new Error('GEMINI_API_KEY is not configured');
    err.statusCode = 503;
    throw err;
  }

  const url =
    'https://generativelanguage.googleapis.com/v1beta/models/' +
    encodeURIComponent(GEMINI_MODEL) +
    ':generateContent?key=' +
    encodeURIComponent(GEMINI_API_KEY);

  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      temperature: 0.75,
      topP: 0.9,
      topK: 40,
      // Needs to be high enough for 5 distinct titles/questions.
      maxOutputTokens: 1024
    }
  };

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const json = await resp.json().catch(() => null);
  if (!resp.ok) {
    const msg = json && (json.error && json.error.message) ? json.error.message : 'Gemini request failed';
    const err = new Error(msg);
    err.statusCode = resp.status || 500;
    throw err;
  }

  const text =
    json &&
    json.candidates &&
    json.candidates[0] &&
    json.candidates[0].content &&
    json.candidates[0].content.parts
      ? json.candidates[0].content.parts.map((p) => p && p.text).filter(Boolean).join('\n')
      : '';

  const extracted = extractJsonArrayFromText(text);
  if (!extracted) {
    const err = new Error('Gemini returned an unexpected format');
    err.statusCode = 500;
    throw err;
  }

  return extracted;
}

function buildPrompt({ keyword, parent, exclusions }) {
  const safeKeyword = String(keyword || '').trim();
  const safeParent = parent ? String(parent).trim() : '';
  const safeExclusions = (exclusions || []).map((x) => String(x || '').trim()).filter(Boolean);

  if (!safeKeyword) {
    const err = new Error('keyword is required');
    err.statusCode = 400;
    throw err;
  }

  const exclusionsText = safeExclusions.length
    ? safeExclusions.slice(0, 80).join(', ')
    : '';

  if (!safeParent) {
    return (
      'Generate 5 informative questions or video titles related to the keyword: "' +
      safeKeyword +
      '". ' +
      'The ideas must be distinct, relevant, and not repetitive. ' +
      (exclusionsText ? 'Avoid repeating any of these topics: ' + exclusionsText + '. ' : '') +
      'Return ONLY a valid JSON array of exactly 5 unique strings. Do not include any other text.'
    );
  }

  return (
    'Generate 5 informative questions or video titles related to the selected topic: "' +
    safeParent +
    '" (within the overall keyword: "' +
    safeKeyword +
    '"). ' +
    'The ideas must be distinct, relevant follow-ups and not repetitive. ' +
    (exclusionsText ? 'Avoid repeating any of these topics: ' + exclusionsText + '. ' : '') +
    'Return ONLY a valid JSON array of exactly 5 unique strings. Do not include any other text.'
  );
}

async function generateTrendingIdeas({ keyword, parent, exclusions }) {
  const prompt = buildPrompt({ keyword, parent, exclusions });
  const itemsRaw = await callGeminiGenerateContent({ prompt });
  const items = dedupeStrings(itemsRaw).map((s) => String(s).trim());
  const sliced = items.slice(0, 5);
  return sliced;
}

module.exports = {
  generateTrendingIdeas
};

