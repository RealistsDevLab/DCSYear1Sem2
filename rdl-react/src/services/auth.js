// src/services/auth.js
// All login / session logic from your old index.html, now in one place.

import { getAdminHash, getMemberByUid, getAllMembers, updateMember } from './firebase'

export async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('')
}

export function normaliseIdentity(s) {
  return (s || '').trim().toLowerCase()
}

export async function getDeviceFingerprint() {
  const raw = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  ].join('|')
  return sha256(raw)
}

// Returns { ok: true, member } or { ok: false, error: string }
export async function loginMember(identity, code) {
  const members = await getAllMembers()
  const normId  = normaliseIdentity(identity)

  const entry = Object.entries(members).find(([, m]) =>
    normaliseIdentity(m.name)  === normId ||
    normaliseIdentity(m.email) === normId ||
    normaliseIdentity(m.phone) === normId
  )

  if (!entry) return { ok: false, error: 'Identity not found.' }

  const [uid, member] = entry

  if (!member.active) return { ok: false, error: 'Your account is inactive. Contact admin.' }

  const codeHash = await sha256(code.trim())
  if (codeHash !== member.codeHash) return { ok: false, error: 'Wrong access code.' }

  const device = await getDeviceFingerprint()
  if (member.deviceHash && member.deviceHash !== device) {
    return { ok: false, error: 'Device not recognised. Contact admin to reset.' }
  }

  if (!member.deviceHash) {
    await updateMember(uid, { deviceHash: device })
  }

  const token = await sha256(uid + Date.now() + Math.random())
  return { ok: true, member: { ...member, uid }, token }
}

// Returns { ok: true } or { ok: false, error }
export async function loginAdmin(password) {
  const stored = await getAdminHash()
  if (!stored) return { ok: false, error: 'No admin password set.' }
  const hash = await sha256(password)
  if (hash !== stored) return { ok: false, error: 'Wrong password.' }
  return { ok: true }
}
