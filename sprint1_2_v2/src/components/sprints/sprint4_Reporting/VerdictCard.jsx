import { useState } from "react"
import { AlertTriangle, Printer, CheckCircle2, Activity } from "lucide-react"

const TABS = ["Verdict Clinique", "Conseil Génétique", "Recommandations"]

const asArray = (value) => {
  if (Array.isArray(value)) return value
  if (typeof value === "string" && value.trim()) return [value.trim()]
  return []
}

const normalizeFlatReport = (report) => {
  if (!report || typeof report !== "object") return null

  const hasFlatShape =
    "verdict_clinique" in report ||
    "codon_6_state" in report ||
    "expert_ai_logic" in report

  if (!hasFlatShape) return null

  const verdictClinique = report.verdict_clinique || "Variant inconnu"
  const codon6 = report.codon_6_state || "Autre"
  const isHealthy = verdictClinique === "Sain"
  const isPathogenic = verdictClinique === "Atteint de Drépanocytose"

  return {
    verdict: {
      gene: report.gene_detected || "HBB",
      codon: codon6,
      change: codon6 === "GTG" ? "Glu -> Val (E6V)" : codon6 === "GAG" ? "Aucun" : "Variant inconnu",
      classification: isPathogenic ? "Pathogenic" : isHealthy ? "Benign" : "VUS",
      condition: verdictClinique,
      status: verdictClinique,
    },
    counseling: [],
    recommendations: asArray(report.recommandations),
    alert: {
      level: isPathogenic ? "critical" : isHealthy ? "normal" : "warning",
      title: verdictClinique,
      subtitle: `${report.gene_detected || "HBB"} — Codon 6 : ${codon6}`,
    },
    summary: report.expert_ai_logic || "",
    fiabilite: report.fiabilite || "",
    gc_content: report.gc_content || "",
  }
}

/**
 * VerdictCard
 * Props:
 *   report  — analysisData.ai_report
 *   onPrint — optional print handler
 */
export default function VerdictCard({ report, onPrint }) {
  const [activeTab, setActiveTab] = useState(0)

  const ai = normalizeFlatReport(report) || report || {}
  const verdict = ai.verdict || {}
  const counseli = Array.isArray(ai.counseling) ? ai.counseling : []
  const recs = Array.isArray(ai.recommendations) ? ai.recommendations : []
  const alert = ai.alert || {}
  const summary = ai.summary || ""

  const isPath =
    verdict.classification === "Pathogenic" ||
    verdict.status === "Pathogène" ||
    verdict.status === "Atteint de Drépanocytose" ||
    alert.level === "critical"

  const isSain =
    verdict.classification === "Benign" ||
    verdict.status === "Sain" ||
    alert.level === "normal"

  const alertBg = isPath
    ? "bg-red-50 border-red-200"
    : "bg-amber-50 border-amber-200"

  const alertTitle = isPath ? "text-red-600" : "text-amber-700"
  const alertSub = isPath ? "text-red-500" : "text-amber-600"

  const AlertIcon = isPath
    ? () => <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
    : isSain
    ? () => <CheckCircle2 className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
    : () => <Activity className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />

  const classBadge =
    verdict.classification === "Pathogenic"
      ? "text-red-600"
      : verdict.classification === "Benign"
      ? "text-emerald-600"
      : "text-amber-600"

  const rows = [
    { key: "Gène", val: verdict.gene },
    { key: "Position", val: verdict.position },
    { key: "Codon 6", val: verdict.codon, mono: true },
    {
      key: "Changement",
      val: verdict.change,
      mono: true,
      red: !!verdict.change && verdict.change !== "Aucun",
    },
    { key: "Classification", val: verdict.classification, cls: classBadge },
    { key: "Zygosité", val: verdict.zygosity },
    { key: "Condition", val: verdict.condition, full: true },
    { key: "Statut", val: verdict.status },
    { key: "Fiabilité", val: ai.fiabilite },
    { key: "GC Content", val: ai.gc_content, mono: true },
  ].filter((r) => r.val)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
      <div className={`flex gap-3 items-start rounded-xl border p-3 ${alertBg}`}>
        <AlertIcon />
        <div>
          <p className={`text-sm font-semibold ${alertTitle}`}>
            {alert.title || (isPath ? "Mutation pathogène détectée" : "Séquence normale")}
          </p>
          <p className={`text-xs mt-0.5 ${alertSub}`}>
            {alert.subtitle ||
              (isPath
                ? "Gène HBB — Drépanocytose associée (HbS)"
                : "Gène HBB — Codon 6 normal (GAG)")}
          </p>
        </div>
      </div>

      <div className="flex border-b border-gray-100">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            className={`text-xs px-3 py-2 border-b-2 transition-colors flex items-center gap-1 ${
              activeTab === i
                ? "border-blue-600 text-blue-600 font-medium"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            {tab}
            {i === 1 && counseli.length > 0 && (
              <span className="bg-teal-100 text-teal-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {counseli.length}
              </span>
            )}
            {i === 2 && recs.length > 0 && (
              <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {recs.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 0 && (
        <div className="space-y-3">
          {rows.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {rows.map(({ key, val, mono, red, cls, full }) => (
                <div key={key} className={`bg-gray-50 rounded-xl p-3 ${full ? "col-span-2" : ""}`}>
                  <p className="text-xs text-gray-400 capitalize">{key}</p>
                  <p
                    className={`text-sm font-medium mt-0.5 ${
                      red
                        ? "text-red-600 font-mono"
                        : cls
                        ? cls
                        : mono
                        ? "font-mono text-gray-800"
                        : "text-gray-800"
                    }`}
                  >
                    {val}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic text-center py-4">
              Données de verdict non disponibles.
            </p>
          )}

          {summary && (
            <div className="bg-blue-50 rounded-xl border border-blue-100 p-3">
              <p className="text-xs font-semibold text-blue-600 mb-1 uppercase tracking-wider">
                Résumé clinique
              </p>
              <p className="text-xs text-slate-600 leading-relaxed">{summary}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 1 && (
        <ul className="space-y-2.5">
          {counseli.length > 0 ? (
            counseli.map((note, i) => (
              <li key={i} className="flex gap-2.5 text-sm text-gray-600 leading-relaxed">
                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-teal-500 flex-shrink-0" />
                {note}
              </li>
            ))
          ) : (
            <li className="text-sm text-gray-400 italic text-center py-6">
              Aucun conseil génétique disponible.
            </li>
          )}
        </ul>
      )}

      {activeTab === 2 && (
        <ul className="space-y-2.5">
          {recs.length > 0 ? (
            recs.map((rec, i) => (
              <li key={i} className="flex gap-2.5 text-sm text-gray-600 leading-relaxed">
                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                {rec}
              </li>
            ))
          ) : (
            <li className="text-sm text-gray-400 italic text-center py-6">
              Aucune recommandation disponible.
            </li>
          )}
        </ul>
      )}

      <div className="pt-1">
        <button
          onClick={onPrint ?? (() => window.print())}
          className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-xs font-semibold rounded-xl hover:bg-gray-50 transition-colors"
        >
          <Printer className="w-3.5 h-3.5" /> Imprimer
        </button>
      </div>
    </div>
  )
}

