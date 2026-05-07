// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import LoginPage    from './pages/LoginPage'
import AppShell     from './components/AppShell'
import Dashboard    from './pages/Dashboard'
import Gallery      from './pages/Gallery'
import Quiz         from './pages/Quiz'
import Flashcards   from './pages/Flashcards'
import PastPapers   from './pages/PastPapers'
import Leaderboard  from './pages/Leaderboard'
import Discussion   from './pages/Discussion'
import Timetable    from './pages/Timetable'
import Attendance   from './pages/Attendance'
import CodePractice from './pages/CodePractice'
import Profile      from './pages/Profile'
import Settings     from './pages/Settings'
import Admin        from './pages/Admin'

function ProtectedRoute({ children }) {
  const { member, isAdmin, ready } = useAuth()
  if (!ready) return null
  if (!member && !isAdmin) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const { member, isAdmin, ready } = useAuth()
  if (!ready) return null

  const loggedIn = member || isAdmin

  return (
    <Routes>
      <Route path="/login" element={loggedIn ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
        <Route index                element={<Dashboard />} />
        <Route path="gallery"       element={<Gallery />} />
        <Route path="quiz"          element={<Quiz />} />
        <Route path="flashcards"    element={<Flashcards />} />
        <Route path="papers"        element={<PastPapers />} />
        <Route path="leaderboard"   element={<Leaderboard />} />
        <Route path="discuss"       element={<Discussion />} />
        <Route path="timetable"     element={<Timetable />} />
        <Route path="attendance"    element={<Attendance />} />
        <Route path="code"          element={<CodePractice />} />
        <Route path="profile"       element={<Profile />} />
        <Route path="settings"      element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="admin"         element={<ProtectedRoute><Admin /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
