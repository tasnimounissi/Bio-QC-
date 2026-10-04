import { useState } from "react"
import { Dna, CheckCircle2, AlertTriangle, HelpCircle } from "lucide-react"

/**
 * MutationMap
 * Props:
 *   mutation       — from /analyze → mutation field
 *   sequenceLength — from /analyze → metrics.length  (REAL bp count)
 */
export default function MutationMap({ mutation, sequenceLength }) {
  const [showTooltip, setShowTooltip] = useState(true)

  // ── Real length — never hardcode 500 ─────────────────────────────────
  const TOTAL_BP = (sequenceLength && sequenceLength > 0) ? sequenceLength : 500
  const midpoint = Math.round(TOTAL_BP / 2)

  // ── Mutation data ─────────────────────────────────────────────────────
  const status       = mutation?.status      ?? "Inconnu"
  const isPathogenic = status === "Pathogène"
  const isSain       = status === "Sain"
  const codon6       = mutation?.codon6      ?? "N/A"
  const baseChange   = mutation?.base_change ?? null
  const rawPos       = mutation?.position    ?? null
  const hasPosition  = rawPos != null && rawPos > 0

  // Clamp marker to stay inside track (2 %–96 %)
  const markerPct = hasPosition
    ? Math.min(Math.max((rawPos / TOTAL_BP) * 100, 2), 96)
    : 0

  // ── Theme ─────────────────────────────────────────────────────────────
  const theme = isPathogenic
    ? { track:  "linear-gradient(90deg,#99F6E4 0%,#2DD4BF 40%,#0D9488 100%)",
        accent: "#ef4444",
        detailBg: "bg-red-50 border-red-100",
        badge:    "bg-red-500 text-white" }
    : isSain
    ? { track:  "linear-gradient(90deg,#bbf7d0 0%,#4ade80 40%,#16a34a 100%)",
        accent: "#16a34a",
        detailBg: "bg-emerald-50 border-emerald-100",
        badge:    "bg-emerald-600 text-white" }
    : { track:  "linear-gradient(90deg,#fde68a 0%,#fbbf24 40%,#d97706 100%)",
        accent: "#d97706",
        detailBg: "bg-amber-50 border-amber-100",
        badge:    "bg-amber-500 text-white" }

  const StatusIcon = isPathogenic ? AlertTriangle
    : isSain ? CheckCircle2 : HelpCircle
  const iconColor = isPathogenic ? "text-red-500"
    : isSain ? "text-emerald-500" : "text-amber-500"

  // ── Detail sentence ────────────────────────────────────────────────────
  const DetailText = () => {
    if (isPathogenic && baseChange)
      return <>
        Substitution{" "}
        <span className="font-mono font-semibold text-red-600">{baseChange}</span>
        {" "}— Gène HBB (β-globine), associé à la Drépanocytose (variant HbS)
      </>
    if (isSain)
      return <>
        Codon 6{" "}
        <span className="font-mono font-semibold text-emerald-600">GAG</span>
        {" "}— Séquence normale, aucune substitution pathogène détectée.
      </>
    return <>
      Codon 6 :{" "}
      <span className="font-mono font-semibold text-amber-600">{codon6}</span>
      {" "}— Variant non classifié, confirmation biologique recommandée.
    </>
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">

      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <Dna className="w-4 h-4 text-blue-600" />
        <h3 className="text-base font-semibold text-gray-800">
          Visualisation de la séquence génétique
        </h3>
      </div>
      <p className="text-xs text-gray-400 mb-6">
        du gène HBB —{" "}
        <span className="font-mono font-semibold text-gray-600">{TOTAL_BP} pb</span>
      </p>

      {/* Track */}
      <div className="relative mb-6">

        {/* Tooltip */}
        {showTooltip && hasPosition && (
          <div
            className="absolute z-10 -top-10 flex flex-col items-center pointer-events-none"
            style={{ left: `calc(${markerPct}% - 44px)` }}
          >
            <div
              className="text-white text-xs font-semibold px-3 py-1 rounded-md shadow-md whitespace-nowrap"
              style={{ background: theme.accent }}
            >
              Position {rawPos}
            </div>
            <div
              className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent"
              style={{ borderTopColor: theme.accent }}
            />
          </div>
        )}

        {/* Gradient bar */}
        <div
          className="relative w-full h-10 rounded-full"
          style={{ background: theme.track }}
        >
          {/* Mutation marker dot */}
          {hasPosition && (
            <button
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white transition-colors cursor-pointer flex items-center justify-center focus:outline-none"
              style={{ left: `${markerPct}%`, border: `2px solid ${theme.accent}` }}
              onClick={() => setShowTooltip(v => !v)}
              aria-label={`Marker at position ${rawPos}`}
            >
              <span className="w-2 h-2 rounded-full block" style={{ background: theme.accent }} />
            </button>
          )}

          {/* Healthy — no dot, show centered label */}
          {isSain && !hasPosition && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white text-xs font-bold tracking-wider drop-shadow">
                ✓ Aucune mutation — Séquence normale
              </span>
            </div>
          )}
        </div>

        {/* Axis — uses REAL bp values */}
        <div className="flex justify-between mt-2 text-xs text-gray-400 font-mono">
          <span>0 pb</span>
          <span>{midpoint} pb</span>
          <span>{TOTAL_BP} pb</span>
        </div>
      </div>

      {/* Detail card */}
      <div className={`rounded-xl border p-4 ${theme.detailBg}`}>
        <div className="flex items-center gap-2 mb-2">
          <StatusIcon className={`w-4 h-4 ${iconColor}`} />
          <p className="text-sm font-semibold text-gray-700">Détails :</p>
        </div>
        <div className="flex items-start gap-3 flex-wrap">
          {hasPosition && (
            <span className={`font-mono text-xs px-2 py-0.5 rounded font-bold whitespace-nowrap ${theme.badge}`}>
              Position {rawPos}
            </span>
          )}
          <span className="text-sm text-gray-600 leading-relaxed">
            <DetailText />
          </span>
        </div>
      </div>
    </div>
  )
}