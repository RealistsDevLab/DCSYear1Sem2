// src/pages/Dashboard.jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getPhotos, getQuizzes, getFlashcards } from '../services/firebase'
import styles from './Dashboard.module.css'

export default function Dashboard() {
  const { member, isAdmin } = useAuth()
  const name = isAdmin ? 'Admin' : member?.name || 'Realist'

  const [stats, setStats] = useState({ photos: 0, quizzes: 0, flashcards: 0 })

  useEffect(() => {
    async function load() {
      const [photos, quizzes, flashcards] = await Promise.all([
        getPhotos(), getQuizzes(), getFlashcards()
      ])
      setStats({ photos: photos.length, quizzes: quizzes.length, flashcards: flashcards.length })
    }
    load()
  }, [])

  const STAT_CARDS = [
    { num: 5,               label: 'Course Units',  color: 'var(--accent)'  },
    { num: stats.photos,    label: 'Group Photos',  color: 'var(--accent3)' },
    { num: stats.quizzes,   label: 'Quizzes',       color: 'var(--accent2)' },
    { num: stats.flashcards,label: 'Flashcards',    color: 'var(--accent4)' },
  ]

  const FEATURES = [
    { icon: '📸', cat: 'GALLERY',    title: 'Group Photo Gallery',    to: '/gallery',     tags: [`${stats.photos} Photos`, 'Slideshow', 'Download'] },
    { icon: '🧠', cat: 'QUIZZES',    title: 'Tests & Instant Results', to: '/quiz',        tags: [`${stats.quizzes} Tests`, 'Instant Marking', 'Leaderboard'] },
    { icon: '🃏', cat: 'FLASHCARDS', title: 'Study Flashcards',        to: '/flashcards',  tags: [`${stats.flashcards}+ Cards`, 'Flip to Reveal', 'All Courses'] },
    { icon: '🏆', cat: 'LEADERBOARD',title: 'Top Performers',           to: '/leaderboard', tags: ['All Tests', 'Rankings', 'Medals'] },
    { icon: '💬', cat: 'DISCUSS',    title: 'Discussion Board',         to: '/discuss',     tags: ['Ask Questions', 'Share Notes', 'Collaborate'] },
    { icon: '📅', cat: 'TIMETABLE',  title: 'Class Timetable',          to: '/timetable',   tags: ['Weekly Schedule', 'Exam Dates', 'Reminders'] },
  ]

  return (
    <div className="fade-in">
      <h1 className={styles.greeting}>Good day, {name} 👋</h1>
      <p className={styles.sub}>DCS Year 1 · Semester 2 · <span style={{color:'var(--accent3)'}}>UICT 2026</span> · TheRealistDevLab</p>
      <p className={styles.credit}>Developed by <span style={{color:'var(--accent)'}}>Bravehart</span> · TheRealists 🌍</p>

      {/* Stat cards */}
      <div className={styles.statsRow}>
        {STAT_CARDS.map(s => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statNum} style={{color: s.color}}>{s.num}</div>
            <div className={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Feature cards */}
      <div className={styles.sectionTitle}>FEATURES</div>
      <div className={styles.featuresGrid}>
        {FEATURES.map(f => (
          <Link key={f.to} to={f.to} className={styles.featureCard}>
            <div className={styles.featureTop}>
              <div className={styles.featureIconWrap}>{f.icon}</div>
              <div>
                <div className={styles.featureCat}>{f.cat}</div>
                <div className={styles.featureTitle}>{f.title}</div>
              </div>
            </div>
            <div className={styles.featureTags}>
              {f.tags.map(t => <span key={t} className={styles.tag}>{t}</span>)}
            </div>
            <div className={styles.featureBtn}>Open {f.cat.charAt(0) + f.cat.slice(1).toLowerCase()} →</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
