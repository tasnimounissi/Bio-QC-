import { useState } from 'react'
import axios from 'axios'
import {
  User, Mail, Lock, Eye, EyeOff,
  CheckCircle, AlertCircle, Loader2, Save, Shield
} from 'lucide-react'
import Navbar from './Navbar'
import { useUser } from '../../../context/UserContext'

// ── small helpers ──────────────────────────────────────────────────────────
function Field({ label, icon: Icon, error, children }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
        <Icon size={14} className="text-gray-400" />
        {label}
      </label>
      {children}
      {error && (
        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
          <AlertCircle size={11} /> {error}
        </p>
      )}
    </div>
  )
}

function PasswordInput({ value, onChange, placeholder, error }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full border rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-bio-blue transition ${
          error ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
        }`}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        tabIndex={-1}
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  )
}

function Toast({ type, message }) {
  return (
    <div
      className={`fixed bottom-6 right-6 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium z-50 animate-fade-in-up ${
        type === 'success'
          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
          : 'bg-red-50 border-red-200 text-red-700'
      }`}
    >
      {type === 'success'
        ? <CheckCircle size={16} />
        : <AlertCircle size={16} />
      }
      {message}
    </div>
  )
}

// ── main page ──────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { user, updateUser } = useUser()

  // ── profile form ──
  const [fullName, setFullName] = useState(user?.fullName || '')
  const [email,    setEmail]    = useState(user?.email    || '')
  const [profileErrors, setProfileErrors] = useState({})
  const [profileLoading, setProfileLoading] = useState(false)

  // ── password form ──
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword,     setNewPassword]     = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordErrors,  setPasswordErrors]  = useState({})
  const [passwordLoading, setPasswordLoading] = useState(false)

  // ── toast ──
  const [toast, setToast] = useState(null)

  const showToast = (type, message) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3500)
  }

  // ── profile validation ─────────────────────────────────────────────────
  const validateProfile = () => {
    const errs = {}
    if (!fullName.trim())        errs.fullName = 'Full name is required.'
    if (!email.trim())           errs.email    = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
                                 errs.email    = 'Enter a valid email address.'
    setProfileErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleProfileSave = async () => {
    if (!validateProfile()) return
    setProfileLoading(true)
    try {
      // PUT /update-profile  →  { user_id, full_name, email }
      const res = await axios.put('http://localhost:8000/update-profile', {
        user_id:   user?.id,
        full_name: fullName,
        email,
      })
      updateUser({ fullName: res.data.fullName, email: res.data.email })
      showToast('success', 'Profile updated successfully!')
    } catch (err) {
      showToast('error', err.response?.data?.detail || 'Failed to update profile.')
    } finally {
      setProfileLoading(false)
    }
  }

  // ── password validation ────────────────────────────────────────────────
  const validatePassword = () => {
    const errs = {}
    if (!currentPassword)       errs.currentPassword = 'Current password is required.'
    if (!newPassword)           errs.newPassword     = 'New password is required.'
    else if (newPassword.length < 6)
                                errs.newPassword     = 'Password must be at least 6 characters.'
    if (newPassword !== confirmPassword)
                                errs.confirmPassword = 'Passwords do not match.'
    setPasswordErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handlePasswordSave = async () => {
    if (!validatePassword()) return
    setPasswordLoading(true)
    try {
      // PUT /update-password  →  { user_id, current_password, new_password }
      await axios.put('http://localhost:8000/update-password', {
        user_id:          user?.id,
        current_password: currentPassword,
        new_password:     newPassword,
      })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      showToast('success', 'Password changed successfully!')
    } catch (err) {
      const detail = err.response?.data?.detail
      if (detail?.toLowerCase().includes('current')) {
        setPasswordErrors({ currentPassword: detail })
      } else {
        showToast('error', detail || 'Failed to change password.')
      }
    } finally {
      setPasswordLoading(false)
    }
  }

  // ── avatar initials ────────────────────────────────────────────────────
  const initials = fullName
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'DR'

  // ── render ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {toast && <Toast type={toast.type} message={toast.message} />}

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Page header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Account Settings</h2>
          <p className="text-gray-500 mt-1">Manage your profile and security preferences</p>
        </div>

        {/* Avatar card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6 flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-bio-blue flex items-center justify-center shadow-md flex-shrink-0">
            <span className="text-white text-2xl font-bold">{initials}</span>
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{fullName || '—'}</p>
            <p className="text-sm text-gray-500">{email || '—'}</p>
            <span className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full">
              <CheckCircle size={11} /> Active account
            </span>
          </div>
        </div>

        {/* ── Profile info ─────────────────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-blue-50 rounded-lg">
              <User size={18} className="text-bio-blue" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Personal Information</h3>
              <p className="text-xs text-gray-400">Update your name and email address</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Full Name" icon={User} error={profileErrors.fullName}>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ex: Mohamed Ahmed"
                className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bio-blue transition ${
                  profileErrors.fullName ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
                }`}
              />
            </Field>

            <Field label="Email Address" icon={Mail} error={profileErrors.email}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex: doctor@hospital.com"
                className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bio-blue transition ${
                  profileErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
                }`}
              />
            </Field>
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={handleProfileSave}
              disabled={profileLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-bio-blue text-white rounded-lg font-semibold text-sm hover:opacity-90 disabled:opacity-60 transition shadow-sm"
            >
              {profileLoading
                ? <Loader2 size={15} className="animate-spin" />
                : <Save size={15} />
              }
              Save Changes
            </button>
          </div>
        </section>

        {/* ── Password ─────────────────────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Shield size={18} className="text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Change Password</h3>
              <p className="text-xs text-gray-400">Use a strong password of at least 6 characters</p>
            </div>
          </div>

          <div className="space-y-4">
            <Field label="Current Password" icon={Lock} error={passwordErrors.currentPassword}>
              <PasswordInput
                value={currentPassword}
                onChange={setCurrentPassword}
                placeholder="Your current password"
                error={passwordErrors.currentPassword}
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="New Password" icon={Lock} error={passwordErrors.newPassword}>
                <PasswordInput
                  value={newPassword}
                  onChange={setNewPassword}
                  placeholder="New password"
                  error={passwordErrors.newPassword}
                />
              </Field>

              <Field label="Confirm New Password" icon={Lock} error={passwordErrors.confirmPassword}>
                <PasswordInput
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  placeholder="Repeat new password"
                  error={passwordErrors.confirmPassword}
                />
              </Field>
            </div>

            {/* Strength bar */}
            {newPassword && (
              <div>
                <p className="text-xs text-gray-400 mb-1">Password strength</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((level) => {
                    const strength =
                      newPassword.length >= 12 && /[A-Z]/.test(newPassword) && /\d/.test(newPassword) && /[^A-Za-z0-9]/.test(newPassword) ? 4
                      : newPassword.length >= 10 ? 3
                      : newPassword.length >= 6  ? 2
                      : 1
                    const colors = ['bg-red-400', 'bg-amber-400', 'bg-blue-400', 'bg-emerald-500']
                    return (
                      <div
                        key={level}
                        className={`h-1.5 flex-1 rounded-full transition-all ${
                          level <= strength ? colors[strength - 1] : 'bg-gray-200'
                        }`}
                      />
                    )
                  })}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {newPassword.length < 6   ? 'Too short'
                  : newPassword.length < 10  ? 'Fair — add uppercase & numbers'
                  : newPassword.length < 12  ? 'Good'
                  : 'Strong ✓'}
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={handlePasswordSave}
              disabled={passwordLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-lg font-semibold text-sm hover:opacity-90 disabled:opacity-60 transition shadow-sm"
            >
              {passwordLoading
                ? <Loader2 size={15} className="animate-spin" />
                : <Shield size={15} />
              }
              Update Password
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}