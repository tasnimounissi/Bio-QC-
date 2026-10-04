import { useState, useEffect } from 'react'
import axios from 'axios'
import {
  Dna, Search, Filter, ChevronDown, ChevronUp,
  CheckCircle, XCircle, AlertCircle, Loader2,
  Calendar, User, Hash, Zap, Download, RefreshCw
} from 'lucide-react'
import Navbar from './Navbar'

// ── helpers ────────────────────────────────────────────────────────────────
const badge = (label, ok) =>
  ok
    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
    : 'bg-red-100 text-red-600 border border-red-200'

const gcColor = (gc) => {
  if (gc >= 40 && gc <= 60) return 'text-emerald-600'
  if (gc >= 30 && gc < 40) return 'text-amber-500'
  return 'text-red-500'
}

// ── sub-components ─────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color = 'blue' }) {
  const colors = {
    blue:   'bg-blue-50   text-bio-blue',
    green:  'bg-green-50  text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    amber:  'bg-amber-50  text-amber-600',
  }
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-center gap-4">
      <div className={`p-3 rounded-xl ${colors[color]}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  )
}

function SequenceRow({ entry, expanded, onToggle }) {
  const isReliable = entry.reliability === 'Reliable'

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
      {/* Main row */}
      <div
        className="flex items-center gap-4 p-4 cursor-pointer select-none"
        onClick={onToggle}
      >
        {/* ID badge */}
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
          <span className="text-xs font-bold text-gray-600">#{entry.id}</span>
        </div>

        {/* Patient info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">{entry.patient_name}</p>
          <p className="text-xs text-gray-500">{entry.patient_id} · {entry.age} yrs</p>
        </div>

        {/* GC Content */}
        <div className="hidden sm:block text-center w-20">
          <p className={`text-lg font-bold ${gcColor(entry.gc_content)}`}>
            {entry.gc_content.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-400">GC</p>
        </div>

        {/* Length */}
        <div className="hidden md:block text-center w-24">
          <p className="text-lg font-bold text-gray-700">{entry.length}</p>
          <p className="text-xs text-gray-400">bp</p>
        </div>

        {/* Quality */}
        <div className="hidden sm:block w-14 text-center">
          <span className="inline-block text-xs font-semibold px-2 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
            {entry.quality_score}
          </span>
        </div>

        {/* Reliability */}
        <div className="w-24 text-center">
          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${badge('', isReliable)}`}>
            {isReliable
              ? <CheckCircle size={12} />
              : <XCircle size={12} />
            }
            {entry.reliability}
          </span>
        </div>

        {/* Expand arrow */}
        <div className="flex-shrink-0 text-gray-400">
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50 px-6 py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Detail icon={User}     label="Patient Name"   value={entry.patient_name} />
          <Detail icon={Hash}     label="Patient ID"     value={entry.patient_id} />
          <Detail icon={Calendar} label="Age"            value={`${entry.age} years old`} />
          <Detail icon={Zap}      label="Sequence Length" value={`${entry.length} bp`} />
          <Detail icon={AlertCircle} label="GC Content"  value={`${entry.gc_content.toFixed(2)}%`} />
          <Detail icon={CheckCircle} label="Quality Score" value={entry.quality_score} />

          {/* Sequence preview */}
          <div className="sm:col-span-2 lg:col-span-3">
            <p className="text-xs text-gray-500 mb-1 font-medium">Sequence Preview</p>
            <div className="font-mono text-xs bg-white border border-gray-200 rounded-lg p-3 text-gray-700 overflow-x-auto whitespace-nowrap">
              {entry.sequence?.substring(0, 120)}
              {entry.sequence?.length > 120 && (
                <span className="text-gray-400"> …+{entry.sequence.length - 120} bp</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Detail({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2">
      <Icon size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-semibold text-gray-800">{value}</p>
      </div>
    </div>
  )
}

// ── main page ──────────────────────────────────────────────────────────────
export default function HistoryPage() {
  const [records, setRecords]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [search, setSearch]         = useState('')
  const [filterReliable, setFilterReliable] = useState('all') // all | reliable | unreliable
  const [sortField, setSortField]   = useState('id')
  const [sortDir, setSortDir]       = useState('desc')
  const [expandedId, setExpandedId] = useState(null)

  const fetchHistory = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.get('http://localhost:8000/history')
      setRecords(res.data)
    } catch (err) {
      if (err.code === 'ERR_NETWORK') {
        setError('Cannot reach backend. Make sure FastAPI is running on port 8000.')
      } else {
        setError(`Error: ${err.response?.data?.detail || err.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchHistory() }, [])

  // ── derived data ─────────────────────────────────────────────────────────
  const filtered = records
    .filter((r) => {
      const q = search.toLowerCase()
      return (
        r.patient_name?.toLowerCase().includes(q) ||
        r.patient_id?.toLowerCase().includes(q)
      )
    })
    .filter((r) => {
      if (filterReliable === 'reliable')   return r.reliability === 'Reliable'
      if (filterReliable === 'unreliable') return r.reliability !== 'Reliable'
      return true
    })
    .sort((a, b) => {
      let valA = a[sortField], valB = b[sortField]
      if (typeof valA === 'string') valA = valA.toLowerCase()
      if (typeof valB === 'string') valB = valB.toLowerCase()
      if (valA < valB) return sortDir === 'asc' ? -1 : 1
      if (valA > valB) return sortDir === 'asc' ? 1 : -1
      return 0
    })

  const stats = {
    total:      records.length,
    reliable:   records.filter((r) => r.reliability === 'Reliable').length,
    avgGC:      records.length
                  ? (records.reduce((s, r) => s + r.gc_content, 0) / records.length).toFixed(1)
                  : '—',
    q30:        records.filter((r) => r.quality_score === 'Q30').length,
  }

  const toggleSort = (field) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortField(field); setSortDir('asc') }
  }

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Analysis History</h2>
            <p className="text-gray-500 mt-1">All past DNA/RNA sequence analyses</p>
          </div>
          <button
            onClick={fetchHistory}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-white hover:shadow-sm transition text-sm font-medium"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Dna}          label="Total Analyses" value={stats.total}    color="blue" />
          <StatCard icon={CheckCircle}  label="Reliable"       value={stats.reliable} color="green" />
          <StatCard icon={AlertCircle}  label="Avg GC Content" value={`${stats.avgGC}%`} color="purple" />
          <StatCard icon={Zap}          label="Q30 Quality"    value={stats.q30}      color="amber" />
        </div>

        {/* Search & filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by patient name or ID…"
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-bio-blue shadow-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={15} className="text-gray-400" />
            {['all', 'reliable', 'unreliable'].map((f) => (
              <button
                key={f}
                onClick={() => setFilterReliable(f)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold border capitalize transition ${
                  filterReliable === f
                    ? 'bg-bio-blue text-white border-bio-blue'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-bio-blue'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Column headers */}
        {!loading && filtered.length > 0 && (
          <div className="hidden sm:flex items-center gap-4 px-4 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
            <div className="w-10" />
            <div className="flex-1 cursor-pointer hover:text-gray-600" onClick={() => toggleSort('patient_name')}>
              Patient {sortField === 'patient_name' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
            </div>
            <div className="w-20 text-center cursor-pointer hover:text-gray-600" onClick={() => toggleSort('gc_content')}>
              GC % {sortField === 'gc_content' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
            </div>
            <div className="hidden md:block w-24 text-center cursor-pointer hover:text-gray-600" onClick={() => toggleSort('length')}>
              Length {sortField === 'length' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
            </div>
            <div className="w-14 text-center">Quality</div>
            <div className="w-24 text-center cursor-pointer hover:text-gray-600" onClick={() => toggleSort('reliability')}>
              Reliability {sortField === 'reliability' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
            </div>
            <div className="w-6" />
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 size={36} className="text-bio-blue animate-spin" />
            <p className="text-gray-400">Loading history…</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start gap-3">
            <XCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-32 text-gray-400">
            <Dna size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No records found</p>
            <p className="text-sm mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((entry) => (
              <SequenceRow
                key={entry.id}
                entry={entry}
                expanded={expandedId === entry.id}
                onToggle={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
              />
            ))}
          </div>
        )}

        {/* Footer count */}
        {!loading && !error && (
          <p className="text-xs text-gray-400 text-center mt-6">
            Showing {filtered.length} of {records.length} records
          </p>
        )}
      </div>
    </div>
  )
}