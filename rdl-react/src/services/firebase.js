// src/services/firebase.js
// This is the direct equivalent of your window.FB = { ... } block.
// Every function here matches what you had — just exported properly.

import { initializeApp } from 'firebase/app'
import {
  getDatabase, ref, set, get, onValue,
  push, remove, update, serverTimestamp
} from 'firebase/database'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL:       import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const db  = getDatabase(app)

// ── Auth / Config ──────────────────────────────────────────────────────────
export const getAdminHash  = async () => { const s = await get(ref(db,'config/adminHash')); return s.exists() ? s.val() : null }
export const setAdminHash  = (h) => set(ref(db,'config/adminHash'), h)

// ── Per-Member Accounts ────────────────────────────────────────────────────
export const createMember   = (uid, data) => set(ref(db,'members/'+uid), data)
export const updateMember   = (uid, data) => update(ref(db,'members/'+uid), data)
export const deleteMember   = (uid) => remove(ref(db,'members/'+uid))
export const getAllMembers   = async () => { const s = await get(ref(db,'members')); return s.exists() ? s.val() : {} }
export const getMemberByUid = async (uid) => { const s = await get(ref(db,'members/'+uid)); return s.exists() ? s.val() : null }
export const onMembers      = (cb) => onValue(ref(db,'members'), s => cb(s.exists() ? s.val() : {}))

// ── Announcements ──────────────────────────────────────────────────────────
export const getAnnouncement = async () => { const s = await get(ref(db,'config/announcement')); return s.exists() ? s.val() : '' }
export const setAnnouncement = (v) => set(ref(db,'config/announcement'), v)
export const onAnnouncement  = (cb) => onValue(ref(db,'config/announcement'), s => cb(s.exists() ? s.val() : ''))

// ── Blocklist ──────────────────────────────────────────────────────────────
export const getBlocklist = async () => { const s = await get(ref(db,'blocklist')); return s.exists() ? Object.values(s.val()) : [] }
export const addBlock     = (n) => set(ref(db,'blocklist/'+n.replace(/\s/g,'_')), n)
export const removeBlock  = (n) => remove(ref(db,'blocklist/'+n.replace(/\s/g,'_')))
export const isBlocked    = async (n) => { const s = await get(ref(db,'blocklist/'+n.replace(/\s/g,'_'))); return s.exists() }

// ── Quiz Results ───────────────────────────────────────────────────────────
export const saveResult    = (r) => push(ref(db,'results'), r)
export const getAllResults  = async () => { const s = await get(ref(db,'results')); return s.exists() ? Object.values(s.val()) : [] }
export const clearResults  = () => remove(ref(db,'results'))

// ── Discussion Posts ───────────────────────────────────────────────────────
export const savePost   = (p) => push(ref(db,'posts'), p)
export const getPosts   = async () => { const s = await get(ref(db,'posts')); if (!s.exists()) return []; const a=[]; s.forEach(c=>a.unshift({...c.val(),_key:c.key})); return a }
export const deletePost = (k) => remove(ref(db,'posts/'+k))
export const onPosts    = (cb) => onValue(ref(db,'posts'), s => { const a=[]; if(s.exists()) s.forEach(c=>a.unshift({...c.val(),_key:c.key})); cb(a) })

// ── Dynamic Quizzes ────────────────────────────────────────────────────────
export const saveQuiz     = (q) => push(ref(db,'quizzes'), q)
export const getQuizzes   = async () => { const s = await get(ref(db,'quizzes')); if (!s.exists()) return []; const a=[]; s.forEach(c=>a.push({...c.val(),_key:c.key})); return a }
export const deleteQuiz   = (k) => remove(ref(db,'quizzes/'+k))
export const saveQuestion = (qid,q) => push(ref(db,'quizzes/'+qid+'/questions'), q)

// ── Dynamic Flashcards ─────────────────────────────────────────────────────
export const saveFlashcard   = (f) => push(ref(db,'flashcards'), f)
export const getFlashcards   = async () => { const s = await get(ref(db,'flashcards')); if (!s.exists()) return []; const a=[]; s.forEach(c=>a.push({...c.val(),_key:c.key})); return a }
export const deleteFlashcard = (k) => remove(ref(db,'flashcards/'+k))

// ── Timetable ──────────────────────────────────────────────────────────────
export const saveTimetable = (t) => set(ref(db,'config/timetable'), t)
export const getTimetable  = async () => { const s = await get(ref(db,'config/timetable')); return s.exists() ? s.val() : null }
export const saveExams     = (e) => set(ref(db,'config/exams'), e)
export const getExams      = async () => { const s = await get(ref(db,'config/exams')); return s.exists() ? s.val() : null }

// ── Member Profiles ────────────────────────────────────────────────────────
export const saveProfile   = (name, data) => set(ref(db,'profiles/'+name.replace(/\s/g,'_')), data)
export const getProfile    = async (name) => { const s = await get(ref(db,'profiles/'+name.replace(/\s/g,'_'))); return s.exists() ? s.val() : null }
export const getAllProfiles = async () => { const s = await get(ref(db,'profiles')); return s.exists() ? s.val() : {} }
export const onProfiles    = (cb) => onValue(ref(db,'profiles'), s => cb(s.exists() ? s.val() : {}))

// ── Attendance ─────────────────────────────────────────────────────────────
export const checkIn = (name) => {
  const today = new Date().toISOString().split('T')[0]
  const key = name.replace(/\s/g,'_')
  return set(ref(db,'attendance/'+key+'/'+today), { name, date: today, ts: Date.now() })
}
export const getAttendance = async () => { const s = await get(ref(db,'attendance')); return s.exists() ? s.val() : {} }

// ── Gallery ────────────────────────────────────────────────────────────────
export const uploadPhotoRecord = async (url, public_id, caption) => {
  let lastErr
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await push(ref(db,'gallery'), { src: url, caption, public_id, ts: Date.now() })
      return
    } catch(e) {
      lastErr = e
      await new Promise(r => setTimeout(r, attempt * 500))
    }
  }
  throw lastErr
}
export const getPhotos  = async () => { const s = await get(ref(db,'gallery')); if (!s.exists()) return []; const a=[]; s.forEach(c=>a.push({...c.val(),_key:c.key})); return a }
export const deletePhoto = (key) => remove(ref(db,'gallery/'+key))
export const onGallery  = (cb) => onValue(ref(db,'gallery'), s => { const a=[]; if(s.exists()) s.forEach(c=>a.push({...c.val(),_key:c.key})); cb(a) })

// ── File Storage ───────────────────────────────────────────────────────────
export const saveFile  = (course, data) => push(ref(db,'files/'+course.replace(/\s/g,'_')), data)
export const getFiles  = async (course) => { const s = await get(ref(db,'files/'+course.replace(/\s/g,'_'))); if (!s.exists()) return []; const a=[]; s.forEach(c=>a.push({...c.val(),_key:c.key})); return a }
export const deleteFile = (course, key) => remove(ref(db,'files/'+course.replace(/\s/g,'_')+'/'+key))

// ── Streak ─────────────────────────────────────────────────────────────────
export const getStreak = async (name) => {
  const s = await get(ref(db,'attendance/'+name.replace(/\s/g,'_')))
  if (!s.exists()) return 0
  const days = Object.keys(s.val()).sort().reverse()
  let streak = 0, d = new Date()
  for (const day of days) {
    if (day === d.toISOString().split('T')[0]) { streak++; d.setDate(d.getDate()-1) } else break
  }
  return streak
}

// ── Notifications ──────────────────────────────────────────────────────────
export const sendNotif  = (data) => push(ref(db,'notifications'), { ...data, ts: Date.now(), read: false })
export const getNotifs  = async () => { const s = await get(ref(db,'notifications')); if (!s.exists()) return []; const a=[]; s.forEach(c=>a.push({...c.val(),_key:c.key})); return a.reverse() }
export const markRead   = (key) => update(ref(db,'notifications/'+key), { read: true })
export const onNotifs   = (cb) => onValue(ref(db,'notifications'), s => { const a=[]; if(s.exists()) s.forEach(c=>a.push({...c.val(),_key:c.key})); cb(a.reverse()) })
