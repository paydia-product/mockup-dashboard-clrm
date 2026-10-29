const p = document.getElementById('p')
p.addEventListener('keydown', async (e) => {
  if (e.key !== 'Enter') return
  p.classList.remove('err')
  try {
    const r = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: p.value }),
    })
    if (r.ok) { location.href = '/'; return }
  } catch (_) {}
  void p.offsetWidth
  p.classList.add('err')
  p.select()
})
