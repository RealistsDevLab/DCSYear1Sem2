// src/components/AppShell.jsx
// This is the persistent layout: sidebar on the left, page content on the right.
// Equivalent to the sidebar + view-container in your old HTML.

import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './AppShell.module.css'

const NAV = [
  { to: '/',           icon: '🏠', label: 'Dashboard' },
  { to: '/code',       icon: '💻', label: 'Code Practice' },
  { to: '/papers',     icon: '📋', label: 'Past Papers' },
  { to: '/gallery',    icon: '📸', label: 'Photo Gallery',  accent: 'pink' },
  { to: '/quiz',       icon: '🧠', label: 'Tests & Quizzes', accent: 'green' },
  { to: '/leaderboard',icon: '🏆', label: 'Leaderboard',    accent: 'orange' },
  { to: '/flashcards', icon: '🃏', label: 'Flashcards',     accent: 'purple' },
  { to: '/timetable',  icon: '📅', label: 'Timetable' },
  { to: '/discuss',    icon: '💬', label: 'Discussion' },
  { to: '/attendance', icon: '✅', label: 'Attendance' },
  { to: '/profile',    icon: '👤', label: 'My Profile' },
]

const ACCENT_COLORS = {
  pink:   'rgba(255,101,132,0.15)',
  green:  'rgba(67,233,123,0.15)',
  orange: 'rgba(247,151,30,0.15)',
  purple: 'rgba(108,99,255,0.15)',
}

export default function AppShell() {
  const { member, isAdmin, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className={styles.shell}>
      {/* ── Sidebar ── */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarBrand}>
          <div className={styles.brandIcon}>🚀</div>
          <div>
            <div className={styles.brandName}>TheRealistDevLab</div>
            <div className={styles.brandSub}>DCS · UICT · 2026</div>
          </div>
        </div>

        <div className={styles.sidebarSection}>NAVIGATION</div>
        <nav>
          {NAV.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.active : ''}`
              }
            >
              <span
                className={styles.navIcon}
                style={item.accent ? { background: ACCENT_COLORS[item.accent] } : {}}
              >
                {item.icon}
              </span>
              {item.label}
            </NavLink>
          ))}

          {isAdmin && (
            <>
              <NavLink to="/settings" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
                <span className={styles.navIcon}>⚙️</span> Settings
              </NavLink>
              <NavLink to="/admin" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
                <span className={styles.navIcon}>🛡️</span> Admin
              </NavLink>
            </>
          )}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.memberInfo}>
            <div className={styles.memberAvatar}>
              {isAdmin ? '🛡️' : member?.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <div className={styles.memberName}>{isAdmin ? 'Admin' : member?.name}</div>
              <div className={styles.memberRole}>{isAdmin ? 'Administrator' : 'Member'}</div>
            </div>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout}>Sign Out</button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
