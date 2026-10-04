import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useUser } from '../../../context/UserContext'
import LoadingScreen from '../../ui/LoadingScreen'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { loginUser } = useUser()

  // Load saved email from localStorage on component mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('bioqc_remembered_email')
    if (savedEmail) {
      setEmail(savedEmail)
      setRememberMe(true)
    }
  }, [])

  const handleSignIn = (e) => {
    e.preventDefault()
    setError('')
    
    // Validate fields
    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }

    // Trigger fake loading
    setIsLoading(true)
    
    // Simulate 2-second loading period
    setTimeout(() => {
      // Validate user credentials with correct email and password
      const result = loginUser(email, password)
      if (!result.success) {
        setError(result.message)
        setIsLoading(false)
        return
      }

      // Save email to localStorage only on successful login and if Remember Me is checked
      if (rememberMe) {
        localStorage.setItem('bioqc_remembered_email', email)
      } else {
        localStorage.removeItem('bioqc_remembered_email')
      }

      setIsLoading(false)
      navigate('/dashboard')
    }, 2000)
  }

  const handleForgotPassword = (e) => {
    e.preventDefault()
    alert('Please contact the IT department at it-support@hospital.com to reset your password.')
  }

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <div className="w-full">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
        <p className="text-gray-600">Sign in to your Bio-QC account</p>
      </div>

      <form onSubmit={handleSignIn} className="space-y-5">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Professional Email Input */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Professional Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bio-blue focus:border-transparent transition"
            required
          />
        </div>

        {/* Password Input */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bio-blue focus:border-transparent transition"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? (
                <EyeOff size={20} />
              ) : (
                <Eye size={20} />
              )}
            </button>
          </div>
        </div>

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-bio-blue focus:ring-bio-blue cursor-pointer"
            />
            <span className="text-sm text-gray-700">Remember me</span>
          </label>
          <button
            type="button"
            onClick={handleForgotPassword}
            className="text-sm text-bio-blue hover:text-blue-700 font-medium"
          >
            Forgot password?
          </button>
        </div>

        {/* Sign In Button */}
        <button
          type="submit"
          className="w-full bg-bio-blue text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-200 mt-6"
        >
          Sign In
        </button>
      </form>

      {/* Sign Up Link */}
      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="text-bio-blue hover:text-blue-700 font-semibold">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  )
}

