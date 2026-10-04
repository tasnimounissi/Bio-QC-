import { useState, useRef } from 'react'
import axios from 'axios'
import { Upload, CheckCircle, AlertCircle, Zap, Loader2 } from 'lucide-react'
import Navbar from './Navbar'

/**
 * Dashboard — Sprint 2 shell, upgraded to call POST /analyze.
 *
 * KEY CHANGE vs original:
 *   ❌ Old: axios.GET('/analyze-dna', { params: { sequence } })
 *           + builds fake ai_report with hardcoded strings
 *   ✅ New: axios.POST('/analyze', FormData with the actual file)
 *           + passes response.data straight to onAnalysisSuccess
 *
 * This means the Groq AI report (counseling, recommendations, verdict)
 * flows untouched from backend → AnalysisPage → VerdictCard.
 */
export default function Dashboard({
  onAnalysisStart,
  onAnalysisSuccess,
  onAnalysisError,
  analysisData,
}) {
  const [dragActive,   setDragActive]   = useState(false)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [loading,      setLoading]      = useState(false)
  const [localResults, setLocalResults] = useState(null)   // for the metric cards
  const [error,        setError]        = useState(null)

  const [patientName, setPatientName] = useState('')
  const [patientId,   setPatientId]   = useState('')
  const [patientAge,  setPatientAge]  = useState('')

  // Refs prevent stale-closure bugs in async handlers
  const nameRef = useRef('')
  const idRef   = useRef('')
  const ageRef  = useRef('')

  const onName = (v) => { setPatientName(v); nameRef.current = v }
  const onId   = (v) => { setPatientId(v);   idRef.current   = v }
  const onAge  = (v) => { setPatientAge(v);  ageRef.current  = v }

  // ─────────────────────────────────────────────────────────────────────────
  // sendToBackend
  // Sends a multipart/form-data POST to /analyze.
  // The response already contains patient, metrics, quality_data,
  // mutation, and ai_report (with real Groq counseling + recommendations).
  // ─────────────────────────────────────────────────────────────────────────
  const sendToBackend = async (file) => {
    setError(null)
    setLocalResults(null)

    const name = nameRef.current
    const id   = idRef.current
    const age  = ageRef.current

    if (!name || !id || !age) {
      const msg = "Veuillez remplir toutes les informations patient avant d'uploader le fichier."
      setError(msg)
      setUploadedFile(null)
      if (onAnalysisError) onAnalysisError(msg, null)
      return
    }

    setLoading(true)
    if (onAnalysisStart) onAnalysisStart(file)

    try {
      // Build FormData — file upload + patient metadata
      const formData = new FormData()
      formData.append('file',   file)
      formData.append('p_name', name)
      formData.append('p_id',   id)
      formData.append('p_age',  parseInt(age, 10))

      // POST /analyze — full pipeline: parse → validate HBB → Codon6 → Groq
      const response = await axios.post(
        'http://localhost:8000/analyze',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )

      const data = response.data
      // data shape:
      // {
      //   patient:      { name, id, age, status, db_id }
      //   metrics:      { length, gc_content, quality_score, reliability }
      //   quality_data: [ { position, quality }, … ]   ← spans real length
      //   mutation:     { status, codon6, position_brute, base_change, amino_change, … }
      //   ai_report:    { verdict, counseling, recommendations, alert, summary }
      // }

      // Cache a minimal copy for the local metric cards (right column)
      setLocalResults({
        patient_name:  data.patient?.name,
        patient_id:    data.patient?.id,
        age:           data.patient?.age,
        length:        data.metrics?.length,
        gc_content:    data.metrics?.gc_content,
        quality_score: data.metrics?.quality_score,
        reliability:   data.metrics?.reliability,
      })

      // Pass the FULL unmodified backend response to AnalysisPage → VerdictCard
      if (onAnalysisSuccess) onAnalysisSuccess(data)

    } catch (err) {
      let msg = 'Erreur inconnue'

      if (err.code === 'ERR_NETWORK') {
        msg = 'Impossible de contacter le backend. Vérifiez que FastAPI tourne sur le port 8000.'

      } else if (err.response?.status === 422) {
        // Structured WRONG_GENE error from FastAPI
        const detail = err.response.data?.detail
        if (detail?.code === 'WRONG_GENE') {
          // Route to the WrongGeneModal in AnalysisPage — pass raw response
          if (onAnalysisError) onAnalysisError(detail.message, err.response.data)
          setLoading(false)
          return
        }
        msg = detail?.message || JSON.stringify(detail) || 'Erreur de validation'

      } else {
        msg = `Erreur : ${err.response?.data?.detail || err.message}`
      }

      setError(msg)
      if (onAnalysisError) onAnalysisError(msg, err.response?.data || null)

    } finally {
      setLoading(false)
    }
  }

  const processFile = (file) => {
    setError(null)
    if (file.name.endsWith('.fasta') || file.name.endsWith('.fastq')) {
      setUploadedFile(file)
      sendToBackend(file)
    } else {
      const msg = 'Format invalide. Veuillez uploader un fichier .fasta ou .fastq'
      setError(msg)
      if (onAnalysisError) onAnalysisError(msg, null)
    }
  }

  const handleReset = () => {
    setLocalResults(null); setUploadedFile(null); setError(null)
    setPatientName(''); nameRef.current = ''
    setPatientId('');   idRef.current   = ''
    setPatientAge('');  ageRef.current  = ''
  }

  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation()
    setDragActive(e.type === 'dragenter' || e.type === 'dragover')
  }
  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0])
  }
  const handleFileInput = (e) => {
    if (e.target.files?.[0]) processFile(e.target.files[0])
  }

  // Derived display values for the metric cards
  const totalReads   = localResults?.length        ?? 0
  const qualityScore = localResults?.quality_score ?? '—'
  const gcPercent    = localResults ? Math.round(localResults.gc_content) : 0
  const reliability  = localResults?.reliability   ?? '—'
  const isReliable   = reliability === 'Reliable'

  

  return (
    <div className="bg-[#F8FAFC]">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-gray-500 text-sm mb-8">
          Téléchargez et analysez vos séquences d'ADN/ARN
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">

          {/* ── Left column ─────────────────────────────────────────── */}
          <div className="space-y-6">

            {/* Drop zone */}
            <div
              onDragEnter={handleDrag} onDragLeave={handleDrag}
              onDragOver={handleDrag} onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-2xl p-10 flex flex-col items-center
                justify-center text-center transition-colors cursor-pointer
                ${dragActive
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-blue-300'}`}
            >
              <input
                id="file-input" type="file" accept=".fasta,.fastq"
                className="hidden" onChange={handleFileInput}
              />
              <label htmlFor="file-input" className="cursor-pointer flex flex-col items-center gap-4">
                <div className="p-4 bg-gray-100 rounded-full">
                  {loading
                    ? <Loader2 size={32} className="text-blue-600 animate-spin" />
                    : <Upload  size={32} className="text-blue-600" />
                  }
                </div>
                {uploadedFile ? (
                  <div>
                    <p className="text-lg font-semibold text-gray-900">{uploadedFile.name}</p>
                    <p className="text-sm text-gray-500">
                      ({(uploadedFile.size / 1024).toFixed(2)} Ko)
                      {loading && <span className="ml-2 text-blue-600">Analyse en cours…</span>}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-lg font-semibold text-gray-900">Glissez votre fichier ici</p>
                    <p className="text-sm text-gray-500 mt-1">ou cliquez pour sélectionner (.fasta ou .fastq)</p>
                  </div>
                )}
              </label>
            </div>

            {/* Error banner */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Patient form */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Informations destinées aux patients
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

                <div>
                  <label className="text-sm text-gray-600 mb-1 block">
                    Numéro d'identification du patient
                  </label>
                  {localResults ? (
                    <p className="text-2xl font-bold text-gray-900">{localResults.patient_id}</p>
                  ) : (
                    <input type="text" value={patientId}
                      onChange={(e) => onId(e.target.value)}
                      placeholder="Ex : P-40012"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                        text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>

                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Nom du patient</label>
                  {localResults ? (
                    <p className="text-2xl font-bold text-gray-900">{localResults.patient_name}</p>
                  ) : (
                    <input type="text" value={patientName}
                      onChange={(e) => onName(e.target.value)}
                      placeholder="Ex : Mohamed Ahmed"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                        text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>

                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Âge</label>
                  {localResults ? (
                    <p className="text-2xl font-bold text-gray-900">{localResults.age} ans</p>
                  ) : (
                    <input type="number" value={patientAge}
                      onChange={(e) => onAge(e.target.value)}
                      placeholder="Ex : 28" min="0" max="150"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                        text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>

                <div>
                  <label className="text-sm text-gray-600 mb-1 block">État de l'échantillon</label>
                  <p className={`text-2xl font-bold ${localResults ? 'text-green-600' : 'text-gray-400'}`}>
                    {localResults ? 'Active' : '—'}
                  </p>
                </div>
              </div>

              {localResults && (
                <button onClick={handleReset}
                  className="mt-6 text-sm text-gray-500 hover:text-red-500 underline transition">
                  Réinitialiser l'analyse
                </button>
              )}
            </div>
          </div>

          {/* ── Right column — metric cards ──────────────────────────── */}
          <div className="space-y-4">
            {localResults ? (
              <>
                {/* Total Reads */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Total Reads</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">
                        {totalReads.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">pb</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Zap size={24} className="text-blue-600" />
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full transition-all duration-700"
                      style={{ width: `${Math.min((totalReads / 1000) * 100, 100)}%` }} />
                  </div>
                </div>

                {/* Quality Score */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Quality Score</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{qualityScore}</p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-lg">
                      <CheckCircle size={24} className="text-green-600" />
                    </div>
                  </div>
                  <p className="text-xs text-green-600 font-semibold">
                    {qualityScore === 'Q30' ? 'Excellent Quality' : 'Good Quality'}
                  </p>
                </div>

                {/* GC Content */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-600">GC Content</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{gcPercent}%</p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <AlertCircle size={24} className="text-purple-600" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-600">
                    {gcPercent >= 40 && gcPercent <= 60
                      ? 'Composition équilibrée'
                      : 'Composition atypique'}
                  </p>
                </div>

                {/* Reliability */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Data Reliability</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{reliability}</p>
                    </div>
                    <div className={`p-3 rounded-lg ${isReliable ? 'bg-emerald-100' : 'bg-red-100'}`}>
                      <CheckCircle size={24}
                        className={isReliable ? 'text-emerald-600' : 'text-red-500'} />
                    </div>
                  </div>
                  <p className={`text-xs font-semibold ${isReliable ? 'text-emerald-600' : 'text-red-500'}`}>
                    {isReliable ? 'Passed all checks' : 'Failed quality checks'}
                  </p>
                </div>
              </>
            ) : loading ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <Loader2 size={36} className="text-blue-600 animate-spin" />
                  <p className="text-gray-500 text-lg">Analyse en cours…</p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
                <div className="flex items-center justify-center py-16">
                  <p className="text-gray-400 text-base text-center leading-relaxed">
                    En attente du chargement de la séquence…
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
