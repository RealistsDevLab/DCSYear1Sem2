// Stub pages — these compile and render immediately.
// Migrate each one by copying logic from index.html as you go.

function stub(title, icon) {
  return function StubPage() {
    return (
      <div className="fade-in" style={{ padding: '8px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>{icon} {title}</h1>
        <div style={{
          background: 'var(--bg2)', border: '1px dashed var(--border)',
          borderRadius: 16, padding: 40, textAlign: 'center',
          fontFamily: "'JetBrains Mono', monospace", color: 'var(--text3)', fontSize: 13
        }}>
          🚧 This page is being migrated.<br />
          Copy the matching section from <code>index.html</code> into this file.
        </div>
      </div>
    )
  }
}

export const Quiz         = stub('Tests & Quizzes',  '🧠')
export const Flashcards   = stub('Flashcards',        '🃏')
export const PastPapers   = stub('Past Papers',       '📋')
export const Leaderboard  = stub('Leaderboard',       '🏆')
export const Discussion   = stub('Discussion Board',  '💬')
export const Timetable    = stub('Timetable',         '📅')
export const Attendance   = stub('Attendance',        '✅')
export const CodePractice = stub('Code Practice',     '💻')
export const Profile      = stub('My Profile',        '👤')
export const Settings     = stub('Settings',          '⚙️')
export const Admin        = stub('Admin',             '🛡️')
