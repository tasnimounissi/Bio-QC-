import { Dna } from 'lucide-react'

export default function AuthLayout({ children }) {
  return (
    <div className="flex h-screen bg-white">
      {/* Left Side - Blue Hero Section */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-bio-blue to-blue-900 flex-col items-center justify-center p-8">
        <div className="text-center">
          <div className="mb-8">
            <Dna size={80} className="text-white mx-auto" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">Bio-QC Dashboard</h1>
          <p className="text-blue-100 text-lg">
            Advanced DNA/RNA Sequence Quality Control & Analysis
          </p>
          <div className="mt-12 space-y-4 text-left max-w-sm">
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <div className="w-2 h-2 bg-blue-200 rounded-full"></div>
              </div>
              <div>
                <h3 className="text-white font-semibold">Accurate Analysis</h3>
                <p className="text-blue-100 text-sm">Real-time quality metrics for biological sequences</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <div className="w-2 h-2 bg-blue-200 rounded-full"></div>
              </div>
              <div>
                <h3 className="text-white font-semibold">Secure Data</h3>
                <p className="text-blue-100 text-sm">Your research data is protected and encrypted</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <div className="w-2 h-2 bg-blue-200 rounded-full"></div>
              </div>
              <div>
                <h3 className="text-white font-semibold">Fast Results</h3>
                <p className="text-blue-100 text-sm">Instant processing and comprehensive reports</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form Section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  )
}
