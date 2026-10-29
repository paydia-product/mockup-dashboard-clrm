import assert from 'node:assert/strict'
import { validateFile } from '../src/lib.ts'

const MB25 = 25 * 1024 * 1024
const f = (name: string, size: number, type: string) => ({ name, size, type })
assert.equal(validateFile(f('a.pdf', 100, 'application/pdf')), null)
assert.equal(validateFile(f('FOTO.PNG', 100, 'image/png')), null)
assert.equal(validateFile(f('a.jpeg', 100, 'image/jpeg')), null)
assert.ok(validateFile(f('a.gif', 100, 'image/gif')))
assert.ok(validateFile(f('a.pdf', 100, 'image/gif')))
assert.ok(validateFile(f('a.pdf', 100, '')))
assert.equal(validateFile(f('a.pdf', MB25, 'application/pdf')), null)
assert.equal(validateFile(f('a.pdf', MB25 + 1, 'application/pdf')), 'Ukuran file maksimal 25 MB')
assert.equal(validateFile(f('a.pdf', 0, 'application/pdf')), 'File kosong')
assert.ok(validateFile(f('noext', 100, 'application/pdf')))
assert.ok(validateFile({ name: 'x.pdf', size: 10, type: 'image/png' }))
console.log('check-upload: 10 assertions OK')
