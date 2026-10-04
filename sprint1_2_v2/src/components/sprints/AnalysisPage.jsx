import { useState } from "react"
import {
  FileUp, Sparkles, AlertTriangle, X, ShieldAlert,
  CheckCircle2, Activity, Download, ChevronRight, Dna
} from "lucide-react"

import Dashboard          from "./sprint2_Shell/Dashboard"
import GCContentChart     from "./sprint3_Analysis/GCContentChart"
import SequenceVisualizer from "./sprint3_Analysis/SequenceVisualizer"
import MutationMap        from "./sprint3_Analysis/MutationMap"
import VerdictCard        from "./sprint4_Reporting/VerdictCard"
import DNAWaitingState    from "./sprint3_Analysis/DNAWaitingState"

// ═══════════════════════════════════════════════════════════
// WrongGeneModal
// ═══════════════════════════════════════════════════════════
function WrongGeneModal({ detectedHeader, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(10,14,26,0.72)", backdropFilter: "blur(6px)" }}
    >
      <div
        className="relative w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
        style={{
          background: "linear-gradient(145deg,#0f172a,#1e1b3a)",
          border: "1px solid rgba(239,68,68,0.35)",
        }}
      >
        <div className="h-1 w-full"
          style={{ background: "linear-gradient(90deg,#ef4444,#f97316,#ef4444)" }} />

        <div className="p-8">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{
                  background: "radial-gradient(circle,rgba(239,68,68,0.2),transparent 70%)",
                  border: "2px solid rgba(239,68,68,0.4)",
                }}>
                <ShieldAlert className="w-10 h-10 text-red-400" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500" />
              </span>
            </div>
          </div>

          <h2 className="text-center text-xl font-bold text-white mb-2">
            Gène Non Compatible
          </h2>
          <p className="text-center text-red-300 text-sm font-medium mb-6">
            Analyse impossible — Cible HBB requise
          </p>

          <div className="rounded-2xl p-4 mb-4"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <p className="text-sm text-slate-300 leading-relaxed">
              Le gène détecté ne correspond pas au gène cible{" "}
              <span className="font-bold text-red-300">HBB (β-Globine)</span>.
              Ce système analyse exclusivement la Drépanocytose.
            </p>
          </div>

          {detectedHeader && (
            <div className="flex items-center gap-2 rounded-xl p-3 mb-6"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <span className="text-xs text-slate-500 font-mono uppercase tracking-wider">Détecté :</span>
              <span className="text-xs text-amber-300 font-mono truncate">{detectedHeader}</span>
            </div>
          )}

          <div className="rounded-2xl p-4 mb-6"
            style={{ background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.15)" }}>
            <p className="text-xs font-semibold text-emerald-400 mb-2 uppercase tracking-wider">
              ✓ Fichiers acceptés
            </p>
            <ul className="space-y-1">
              {["En-tête FASTA contenant « HBB » ou « Hemoglobin »",
                "Fichiers .fasta / .fastq du gène β-Globine",
                "Séquences issues de panels NGS hémoglobine"].map((t, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                  <ChevronRight className="w-3 h-3 text-emerald-500 flex-shrink-0 mt-0.5" />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <button onClick={onClose}
            className="w-full py-3 rounded-2xl text-sm font-bold text-white hover:opacity-90 active:scale-95 transition-all"
            style={{
              background: "linear-gradient(135deg,#ef4444,#dc2626)",
              boxShadow: "0 4px 20px rgba(239,68,68,0.35)",
            }}>
            Fermer et réessayer
          </button>
        </div>

        <button onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// PDF generator — builds a full HTML report and prints it
// ═══════════════════════════════════════════════════════════
function generatePDF(data) {
  const { patient, metrics, mutation, ai_report: r = {} } = data
  const v   = r.verdict || {}
  const now = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })
  const sc  = mutation?.status === "Pathogène" ? "#dc2626"
    : mutation?.status === "Sain"  ? "#16a34a" : "#d97706"

  const li = (arr) => (arr || []).map(x => `<li>${x}</li>`).join("")

  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/>
<title>Rapport Bio-QC — ${patient?.name}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&family=DM+Mono&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'DM Sans',sans-serif;color:#0f172a;padding:40px;max-width:780px;margin:auto}
  .hdr{display:flex;justify-content:space-between;border-bottom:2px solid #0f172a;padding-bottom:18px;margin-bottom:24px}
  .logo{font-size:20px;font-weight:700;letter-spacing:-.04em}.logo b{color:#2563eb}
  .meta{text-align:right;font-size:11px;color:#64748b;line-height:1.7}
  h2{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#64748b;margin:0 0 10px;padding-bottom:5px;border-bottom:1px solid #e2e8f0}
  .sec{margin-bottom:22px}
  .g2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px}
  .card label{font-size:9px;text-transform:uppercase;letter-spacing:.07em;color:#94a3b8;display:block;margin-bottom:3px}
  .val{font-size:13px;font-weight:600}
  .badge{display:inline-block;padding:3px 12px;border-radius:999px;font-size:11px;font-weight:700;color:#fff;background:${sc}}
  .alert{border-radius:8px;padding:14px;margin-bottom:20px;border:1px solid}
  .alert.p{background:#fef2f2;border-color:#fecaca}.alert.s{background:#f0fdf4;border-color:#bbf7d0}.alert.v{background:#fffbeb;border-color:#fde68a}
  .at{font-weight:700;font-size:13px;color:${sc};margin-bottom:3px}.as{font-size:11px;color:#64748b}
  ul{padding-left:16px} li{font-size:11px;color:#334155;line-height:1.9}
  .sum{font-size:12px;line-height:1.75;color:#334155;background:#f8fafc;border-left:3px solid #2563eb;padding:12px 14px;border-radius:0 8px 8px 0}
  .ftr{margin-top:36px;padding-top:14px;border-top:1px solid #e2e8f0;font-size:9px;color:#94a3b8;display:flex;justify-content:space-between}
  @media print{body{padding:20px}}
</style></head><body>
<div class="hdr">
  <div class="logo">Bio<b>QC</b> — Rapport Génétique</div>
  <div class="meta"><strong>${patient?.name || "—"}</strong><br/>ID : ${patient?.id || "—"} | Âge : ${patient?.age || "—"} ans<br/>Date : ${now}</div>
</div>
<div class="alert ${mutation?.status === "Pathogène" ? "p" : mutation?.status === "Sain" ? "s" : "v"}">
  <div class="at">${r.alert?.title || (mutation?.status === "Pathogène" ? "⚠ Mutation pathogène détectée" : "✓ Séquence normale")}</div>
  <div class="as">${r.alert?.subtitle || ""}</div>
</div>
<div class="sec"><h2>Métriques Techniques</h2>
<div class="g2">
  <div class="card"><label>Longueur réelle</label><div class="val" style="font-family:'DM Mono',monospace">${metrics?.length?.toLocaleString()} pb</div></div>
  <div class="card"><label>Contenu GC</label><div class="val" style="font-family:'DM Mono',monospace">${metrics?.gc_content} %</div></div>
  <div class="card"><label>Score Qualité</label><div class="val" style="font-family:'DM Mono',monospace">${metrics?.quality_score}</div></div>
  <div class="card"><label>Fiabilité</label><div class="val" style="font-family:'DM Mono',monospace">${metrics?.reliability}</div></div>
</div></div>
<div class="sec"><h2>Verdict Clinique — Codon 6</h2>
<div class="g2">
  <div class="card"><label>Gène</label><div class="val">${v.gene || "HBB"}</div></div>
  <div class="card"><label>Statut</label><span class="badge">${mutation?.status || "—"}</span></div>
  <div class="card"><label>Codon 6</label><div class="val" style="font-family:'DM Mono',monospace">${v.codon || mutation?.codon6 || "—"}</div></div>
  <div class="card"><label>Changement</label><div class="val" style="font-family:'DM Mono',monospace">${v.change || "Aucun"}</div></div>
  <div class="card"><label>Classification</label><div class="val">${v.classification || "—"}</div></div>
  <div class="card"><label>Zygosité</label><div class="val">${v.zygosity || "—"}</div></div>
  <div class="card" style="grid-column:span 2"><label>Condition</label><div class="val">${v.condition || "—"}</div></div>
</div></div>
${r.summary ? `<div class="sec"><h2>Résumé Clinique</h2><div class="sum">${r.summary}</div></div>` : ""}
${(r.counseling?.length) ? `<div class="sec"><h2>Conseil Génétique</h2><ul>${li(r.counseling)}</ul></div>` : ""}
${(r.recommendations?.length) ? `<div class="sec"><h2>Recommandations</h2><ul>${li(r.recommendations)}</ul></div>` : ""}
<div class="ftr"><span>Bio-QC Genetics Platform — Rapport généré automatiquement</span><span>Ce rapport ne remplace pas une consultation médicale spécialisée.</span></div>
</body></html>`

  const w = window.open("", "_blank")
  w.document.write(html)
  w.document.close()
  w.focus()
  setTimeout(() => w.print(), 600)
}

// ═══════════════════════════════════════════════════════════
// StatusBanner  (single location for the PDF button)
// ═══════════════════════════════════════════════════════════
function StatusBanner({ data, onPDF }) {
  const status  = data.mutation?.status
  const isPath  = status === "Pathogène"
  const isSain  = status === "Sain"

  const bg     = isPath ? "linear-gradient(135deg,#fef2f2,#fff1f0)"
    : isSain   ? "linear-gradient(135deg,#f0fdf4,#ecfdf5)"
    : "linear-gradient(135deg,#fffbeb,#fef9c3)"
  const border = isPath ? "#fecaca" : isSain ? "#bbf7d0" : "#fde68a"
  const txt    = isPath ? "text-red-700" : isSain ? "text-emerald-700" : "text-amber-700"
  const Icon   = isPath ? AlertTriangle : isSain ? CheckCircle2 : Activity
  const icolor = isPath ? "text-red-500" : isSain ? "text-emerald-500" : "text-amber-500"
  const label  = isPath ? "Mutation pathogène HbS — Drépanocytose"
    : isSain   ? "Aucune mutation pathogène — Séquence normale"
    : `Variant non classifié — Codon 6 : ${data.mutation?.codon6 ?? "N/A"}`
  const btnBg  = isPath ? "linear-gradient(135deg,#dc2626,#b91c1c)"
    : isSain   ? "linear-gradient(135deg,#16a34a,#15803d)"
    : "linear-gradient(135deg,#d97706,#b45309)"
  const btnSh  = isPath ? "0 3px 12px rgba(220,38,38,.3)"
    : isSain   ? "0 3px 12px rgba(22,163,74,.3)"
    : "0 3px 12px rgba(217,119,6,.3)"

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
      <div className="flex items-center justify-between rounded-2xl px-5 py-3.5 gap-4"
        style={{ background: bg, border: `1px solid ${border}` }}>
        <div className="flex items-center gap-3">
          <Icon className={`w-5 h-5 flex-shrink-0 ${icolor}`} />
          <div>
            <p className={`text-sm font-bold ${txt}`}>{label}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Patient : <strong>{data.patient?.name}</strong>
              {" "}— Codon 6 :{" "}
              <span className="font-mono font-semibold">{data.mutation?.codon6 ?? "N/A"}</span>
              {" "}— Longueur :{" "}
              <span className="font-mono font-semibold">{data.metrics?.length?.toLocaleString()} pb</span>
            </p>
          </div>
        </div>
        <button onClick={onPDF}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white flex-shrink-0 hover:opacity-90 active:scale-95 transition-all"
          style={{ background: btnBg, boxShadow: btnSh }}>
          <Download className="w-3.5 h-3.5" />
          Générer Rapport PDF
        </button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// AnalysisPage  — main page
// ═══════════════════════════════════════════════════════════
export default function AnalysisPage() {
  const [analysisData, setAnalysisData] = useState(null)
  const [loading,  setLoading]          = useState(false)
  const [error,    setError]            = useState(null)
  const [wrongGene, setWrongGene]       = useState(null)
  const [fileName, setFileName]         = useState("")

  // Called by Dashboard when user submits the form
  const handleStart = (file) => {
    setLoading(true)
    setError(null)
    setAnalysisData(null)
    setWrongGene(null)
    setFileName(file?.name || "Fichier Séquence")
  }

  // Called by Dashboard when /analyze POST succeeds
  // data = { patient, metrics, quality_data, mutation, ai_report }
  const handleSuccess = (data) => {
    setAnalysisData(data)   // store everything
    setLoading(false)       // stop spinner
  }

  // Called by Dashboard when /analyze POST fails
  const handleError = (msg, raw) => {
    if (raw?.detail?.code === "WRONG_GENE") {
      setWrongGene({ detectedHeader: raw.detail.detected_header })
    } else {
      setError(msg)
    }
    setLoading(false)
  }

  const handlePDF = () => { if (analysisData) generatePDF(analysisData) }

  return (
    <div className="min-h-screen" style={{ background: "#F1F5F9" }}>

      {wrongGene && (
        <WrongGeneModal
          detectedHeader={wrongGene.detectedHeader}
          onClose={() => setWrongGene(null)}
        />
      )}

      {/* Dashboard always visible — handles file upload & calls /analyze */}
      <Dashboard
        onAnalysisStart={handleStart}
        onAnalysisSuccess={handleSuccess}
        onAnalysisError={handleError}
        analysisData={analysisData}
      />

      {/* ── Empty state ──────────────────────────────────────────────── */}
      {!loading && !analysisData && !error && !wrongGene && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div
            className="flex flex-col items-center justify-center min-h-[52vh] rounded-[2.5rem] p-12 text-center"
            style={{
              background: "linear-gradient(145deg,#ffffff,#f0f6ff)",
              border: "2px dashed #bfdbfe",
              boxShadow: "0 4px 32px rgba(37,99,235,.06)",
            }}
          >
            <div className="relative mb-8">
              <div className="w-24 h-24 rounded-full flex items-center justify-center"
                style={{
                  background: "radial-gradient(circle at 35% 35%,#dbeafe,#eff6ff)",
                  boxShadow: "0 0 0 8px rgba(37,99,235,.08),0 0 0 16px rgba(37,99,235,.04)",
                  animation: "pulse 2.5s ease-in-out infinite",
                }}>
                <Dna className="w-10 h-10 text-blue-500" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: "#2563eb", boxShadow: "0 2px 8px rgba(37,99,235,.4)" }}>
                <FileUp className="w-3.5 h-3.5 text-white" />
              </div>
            </div>

            <h2 className="text-3xl font-bold text-slate-800 mb-3"
              style={{ fontFamily: "'DM Sans',sans-serif", letterSpacing: "-.03em" }}>
              Analyse HBB Prête
            </h2>
            <p className="text-slate-500 max-w-md mx-auto mb-2 text-[15px] leading-relaxed">
              Téléchargez votre séquence{" "}
              <span className="font-semibold text-blue-600">.fasta</span> ou{" "}
              <span className="font-semibold text-blue-600">.fastq</span> du gène{" "}
              <span className="font-semibold text-blue-600">β-Globine (HBB)</span>{" "}
              pour générer le rapport clinique complet.
            </p>
            <p className="text-sm text-slate-400 mb-8">⬆ Utilisez le panneau d'upload ci-dessus</p>

            <div className="flex flex-wrap justify-center gap-2">
              {[["🔬","Détection Codon 6"],["🧬","Diagnostic HbS / HbA"],
                ["🤖","IA Llama-3.3-70b"],["📄","Rapport PDF"]].map(([icon, lbl]) => (
                <span key={lbl}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                  style={{ background:"rgba(37,99,235,.07)", border:"1px solid rgba(37,99,235,.15)", color:"#2563eb" }}>
                  {icon} {lbl}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2 text-xs font-medium text-slate-400 uppercase tracking-widest mt-8">
              <Sparkles size={13} className="text-amber-400" />
              Powered by Groq × Bio-QC Genetics Engine
            </div>
          </div>
        </main>
      )}

      {/* ── Loading ─────────────────────────────────────────────────── */}
      {loading && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <DNAWaitingState fileName={fileName} />
        </main>
      )}

      {/* ── Error ───────────────────────────────────────────────────── */}
      {!loading && error && !wrongGene && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-start gap-4 rounded-2xl p-6"
            style={{ background: "#fef2f2", border: "1px solid #fecaca" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "#fee2e2" }}>
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="font-bold text-red-700 text-sm mb-1">Erreur d'analyse</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        </main>
      )}

      {/* ── Results ─────────────────────────────────────────────────── */}
      {!loading && analysisData && (
        <>
          {/* Status banner — contains the ONLY PDF button */}
          <StatusBanner data={analysisData} onPDF={handlePDF} />

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 pt-4">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1fr_1fr_340px] gap-4 items-start">

                {/* GC pie chart */}
                <GCContentChart data={analysisData.metrics} />

                {/* Quality line chart */}
                <SequenceVisualizer data={analysisData.quality_data} />

                {/* VerdictCard — spans 2 rows on desktop */}
                <div className="md:col-span-2 lg:col-span-1 lg:row-span-2">
                  <VerdictCard
                    report={analysisData.ai_report}
                    onPrint={() => window.print()}
                  />
                </div>

                {/* Mutation map — receives REAL sequence length */}
                <div className="md:col-span-2">
                  <MutationMap
                    mutation={analysisData.mutation}
                    sequenceLength={analysisData.metrics?.length}
                  />
                </div>

              </div>
            </div>
          </main>
        </>
      )}
    </div>
  )
}