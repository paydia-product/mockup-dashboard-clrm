import { createHash, createHmac, timingSafeEqual } from 'node:crypto'

const sha = (s) => createHash('sha256').update(String(s)).digest()

export default async function handler(req, res) {
  const { MOCKUP_PASSWORD, AUTH_SECRET } = process.env
  if (!MOCKUP_PASSWORD || !AUTH_SECRET) return res.status(500).json({ error: 'Env belum diset' })
  if (req.method !== 'POST') return res.status(405).end()
  let body = req.body
  if (typeof body === 'string') { try { body = JSON.parse(body) } catch { body = {} } }
  const pw = body && typeof body.password === 'string' ? body.password : ''
  if (!timingSafeEqual(sha(pw), sha(MOCKUP_PASSWORD))) {
    await new Promise((r) => setTimeout(r, 500))
    return res.status(401).json({ error: 'Salah' })
  }
  const exp = String(Date.now() + 86400 * 1000)
  const sig = createHmac('sha256', AUTH_SECRET).update(exp).digest('hex')
  res.setHeader('Set-Cookie', `clrm_auth=${exp}.${sig}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400`)
  return res.status(200).json({ ok: true })
}
