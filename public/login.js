const p = document.getElementById('p')
let busy = false
p.addEventListener('input', () => p.classList.remove('err'))
p.addEventListener('keydown', async (e) => {
  if (e.key !== 'Enter' || busy) return
  busy = true
  p.classList.remove('err')
  p.disabled = true
  document.body.classList.add('busy')
  try {
    const r = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: p.value }),
    })
    if (r.ok) { location.href = '/'; return }
  } catch (_) {}
  busy = false
  p.disabled = false
  document.body.classList.remove('busy')
  void p.offsetWidth
  p.classList.add('err')
  p.focus()
  p.select()
})
