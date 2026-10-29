import { createHash, createHmac, timingSafeEqual } from 'node:crypto'

// ponytail: limiter in-memory per instance serverless (reset saat cold start, tidak dibagi antar instance).
// Jalur upgrade: Vercel WAF rate limit atau KV/Redis.
const MAX_FAIL = 5
const WINDOW_MS = 15 * 60 * 1000
const fails = new Map() // ip -> { n, reset }

const sha = (s) => createHash('sha256').update(String(s)).digest()

export default async function handler(req, res) {
  const { MOCKUP_PASSWORD, AUTH_SECRET } = process.env
  if (!MOCKUP_PASSWORD || !AUTH_SECRET) return res.status(500).json({ error: 'Env belum diset' })
  if (req.method !== 'POST') return res.status(405).end()
  let body = req.body
  if (typeof body === 'string') { try { body = JSON.parse(body) } catch { body = {} } }
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim()
  const now = Date.now()
  for (const [k, v] of fails) if (v.reset <= now) fails.delete(k)
  const rec = fails.get(ip)
  if (rec && rec.n >= MAX_FAIL) {
    res.setHeader('Retry-After', String(Math.ceil((rec.reset - now) / 1000)))
    return res.status(429).json({ error: 'Terlalu banyak percobaan' })
  }
  const pw = body && typeof body.password === 'string' ? body.password : ''
  if (!timingSafeEqual(sha(pw), sha(MOCKUP_PASSWORD))) {
    fails.set(ip, { n: (rec?.n ?? 0) + 1, reset: rec?.reset ?? now + WINDOW_MS })
    await new Promise((r) => setTimeout(r, 500))
    return res.status(401).json({ error: 'Salah' })
  }
  fails.delete(ip)
  const exp = String(Date.now() + 86400 * 1000)
  const sig = createHmac('sha256', AUTH_SECRET).update(exp).digest('hex')
  res.setHeader('Set-Cookie', `clrm_auth=${exp}.${sig}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400`)
  return res.status(200).json({ ok: true })
}
