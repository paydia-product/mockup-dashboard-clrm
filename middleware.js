const next = () => new Response(null, { headers: { 'x-middleware-next': '1' } })

const PUBLIC = new Set(['/login.html', '/login.js', '/login.css', '/api/login', '/api/logout', '/favicon.svg'])

function hex(buf) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function valid(cookie, secret) {
  const [exp, sig] = (cookie || '').split('.')
  if (!exp || !sig || !/^\d+$/.test(exp) || Number(exp) < Date.now()) return false
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const expected = hex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(exp)))
  if (expected.length !== sig.length) return false
  let diff = 0
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i)
  return diff === 0
}

export default async function middleware(request) {
  const url = new URL(request.url)
  if (PUBLIC.has(url.pathname)) return next()
  const secret = process.env.AUTH_SECRET
  if (!secret) return new Response('AUTH_SECRET belum diset', { status: 500 })
  const m = (request.headers.get('cookie') || '').match(/(?:^|;\s*)clrm_auth=([^;]+)/)
  if (m && (await valid(decodeURIComponent(m[1]), secret))) return next()
  return Response.redirect(new URL('/login.html', request.url), 302)
}

export const config = { matcher: ['/((?!_vercel/).*)'] }
