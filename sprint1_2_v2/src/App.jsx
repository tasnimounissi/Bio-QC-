import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { UserProvider } from './context/UserContext'
import AuthLayout from './components/sprints/sprint1_authen/AuthLayout'
import Login from './components/sprints/sprint1_authen/Login'
import Signup from './components/sprints/sprint1_authen/Signup'

import AnalysisPage from './components/sprints/AnalysisPage'
import HistoryPage  from './components/sprints/sprint2_Shell/HistoryPage'
import ProfilePage  from './components/sprints/sprint2_Shell/ProfilePage'

function App() {
  return (
    <UserProvider>
      <Router>
        <Routes>
          {/* ── Sprint 1: Auth ── */}
          <Route path="/login"     element={<AuthLayout><Login /></AuthLayout>} />
          <Route path="/signup"    element={<AuthLayout><Signup /></AuthLayout>} />

          {/* ── Sprint 2/3/4: Main pages ── */}
          <Route path="/dashboard" element={<AnalysisPage />} />
          <Route path="/history"   element={<HistoryPage />} />
          <Route path="/profile"   element={<ProfilePage />} />

          {/* ── Default ── */}
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </UserProvider>
  )
}

export default App