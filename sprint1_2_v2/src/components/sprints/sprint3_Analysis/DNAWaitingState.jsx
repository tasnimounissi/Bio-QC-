import React from 'react';
import { Dna, FileCode, Search, ShieldCheck, Zap } from 'lucide-react';

export default function DNAWaitingState({ fileName }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full max-w-4xl mx-auto p-8 animate-in fade-in zoom-in duration-500">
      {/* Animation de l'hélice d'ADN avec effet de halo */}
      <div className="relative mb-12">
        <div className="absolute inset-0 bg-blue-400/20 blur-[80px] rounded-full animate-pulse"></div>
        <div className="relative z-10 flex items-center justify-center">
          <div className="relative">
            <div className="absolute -inset-4 bg-blue-500/20 rounded-full animate-ping"></div>
            <div className="bg-white p-6 rounded-3xl shadow-2xl border border-blue-100">
              <Dna size={64} className="text-blue-600 animate-[spin_4s_linear_infinite]" />
            </div>
          </div>
        </div>
      </div>

      {/* Texte dynamique */}
      <div className="text-center space-y-4 mb-12">
        <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">
          Analyse Génomique Intelligente
        </h2>
        <div className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 rounded-full w-fit mx-auto">
          <FileCode size={16} className="text-blue-500" />
          <span className="text-sm font-mono font-medium text-blue-700">
            {fileName || "sequence_genome.fasta"}
          </span>
        </div>
      </div>

      {/* Grid de progression */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        {[
          { icon: <Search size={20}/>, text: "Scan des nucléotides", delay: "0ms" },
          { icon: <Zap size={20}/>, text: "Identification HbS", delay: "150ms" },
          { icon: <ShieldCheck size={20}/>, text: "Vérification Clinique", delay: "300ms" }
        ].map((step, i) => (
          <div key={i} 
               style={{ animationDelay: step.delay }}
               className="flex items-center gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm animate-pulse">
            <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
              {step.icon}
            </div>
            <span className="text-sm font-semibold text-gray-600">{step.text}</span>
          </div>
        ))}
      </div>

      {/* Barre de progression technique */}
      <div className="w-full max-w-md mt-16">
        <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600 rounded-full animate-[loading_2s_ease-in-out_infinite] w-1/3"></div>
        </div>
        <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] mt-4 text-center font-bold">
          Bioinformatics Engine — AI Processing
        </p>
      </div>

      <style jsx>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
      `}</style>
    </div>
  );
}