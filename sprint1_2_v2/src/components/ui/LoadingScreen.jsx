import { Dna } from 'lucide-react'

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50">
      <div className="text-center">
        <div className="mb-8 flex justify-center">
          <div className="animate-spin">
            <Dna size={64} className="text-bio-blue" />
          </div>
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Initializing Bio-QC Analysis...
        </h2>
        <p className="text-gray-500">Please wait while we prepare your dashboard</p>
      </div>
    </div>
  )
}
