import { Dna, LogOut, User } from 'lucide-react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useUser } from '../../../context/UserContext'

export default function Navbar() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { user, logoutUser } = useUser()

  const doctorName    = user?.fullName || 'Guest Doctor'
  const doctorEmail   = user?.email    || 'not-signed-in@hospital.com'
  const doctorInitials = doctorName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  const handleLogout = () => {
    logoutUser()
    navigate('/login')
  }

  const navLink = (to, label) => {
    const active = location.pathname === to
    return (
      <Link
        to={to}
        className={`font-medium transition ${
          active
            ? 'text-bio-blue border-b-2 border-bio-blue pb-0.5'
            : 'text-gray-700 hover:text-bio-blue'
        }`}
      >
        {label}
      </Link>
    )
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="bg-bio-blue p-2 rounded-lg">
              <Dna size={24} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Bio-QC Dashboard</h1>
          </div>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-8">
            {navLink('/dashboard', 'Analysis')}
            {navLink('/history',   'History')}
          </div>

          {/* Profile + Logout */}
          <div className="flex items-center gap-4">
            {/* Avatar → clicks to /profile */}
            <Link to="/profile" className="flex items-center gap-2 hover:opacity-80 transition">
              <div className="w-10 h-10 bg-bio-blue rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">{doctorInitials}</span>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{doctorName}</p>
                <p className="text-xs text-gray-500">{doctorEmail}</p>
              </div>
            </Link>

            <button
              onClick={handleLogout}
              className="p-2 text-gray-500 hover:text-red-500 hover:bg-gray-100 rounded-lg transition"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>

        </div>
      </div>
    </nav>
  )
}
