import React, { useState } from "react";
import { Send, Copy, Check, FileText, Globe, Volume2, Bookmark, RefreshCw, AlertTriangle, HelpCircle } from "lucide-react";
import { CopySEOData } from "../types";

interface CopySEOProps {
  onSave: (type: 'copy', title: string, data: any) => void;
}

export default function CopySEO({ onSave }: CopySEOProps) {
  const [idea, setIdea] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedData, setGeneratedData] = useState<CopySEOData | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idea.trim()) return;

    setLoading(true);
    setError(null);
    setGeneratedData(null);
    setSaved(false);

    try {
      const response = await fetch("/api/generate-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea }),
      });

      if (!response.ok) {
        const errObj = await response.json();
        throw new Error(errObj.error || "Une erreur est survenue lors de la génération.");
      }

      const result = await response.json();
      if (result.success && result.data) {
        setGeneratedData({
          id: Date.now().toString(),
          idea,
          hero: result.data.hero,
          features: result.data.features,
          cta: result.data.cta,
          seoTitle: result.data.seoTitle,
          seoDescription: result.data.seoDescription,
          keywords: result.data.keywords,
          hooks: result.data.hooks,
          createdAt: new Date().toISOString()
        });
      } else {
        throw new Error("Format de réponse incorrect.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Impossible de joindre le serveur de génération de copywriting.");
    } finally {
      setLoading(false);
    }
  };

  const copyText = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSaveItem = () => {
    if (!generatedData) return;
    const cleanTitle = generatedData.idea.length > 25 
      ? generatedData.idea.substring(0, 25) + "..." 
      : generatedData.idea;
    onSave('copy', `Copy & SEO: ${cleanTitle}`, generatedData);
    setSaved(true);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <h1 className="text-2xl font-light tracking-tight text-white flex items-center gap-2 font-display">
            <FileText className="h-6 w-6 text-cyan-400" />
            ASSISTANT COPYWRITING & SEO
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Génère le copywriting optimal d'une landing page (UX Copy) et prépare sa stratégie de référencement (SEO complet).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form Pitch Column */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#0c0c0c] border border-white/5 rounded-xl p-6 shadow-md">
            <h2 className="text-sm font-semibold text-white uppercase font-display mb-3 flex items-center gap-2 tracking-wider">
              <Globe className="h-4.5 w-4.5 text-cyan-400" /> Pitch de l'idée
            </h2>
            <p className="text-slate-550 text-[11px] leading-relaxed mb-5 font-mono">
              Décris ton idée de produit, ton SaaS ou l'offre de ton client en quelques phrases simples pour commencer.
            </p>
            <form onSubmit={handleGenerate} className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 font-mono">
                  Idée / Concept
                </label>
                <textarea
                  className="w-full bg-black border border-white/5 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-cyan-500/50 placeholder-slate-650 transition-colors font-mono"
                  rows={6}
                  placeholder="Ex: Une extension Chrome pour les designers indépendants qui capture les palettes de couleurs d'un site web et les exporte directement vers Figma et Tailwind."
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-white text-black hover:bg-cyan-400 hover:text-black font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg hover:shadow-[0_0_15px_rgba(34,211,238,0.25)] active:scale-[0.98] text-xs uppercase tracking-widest font-mono"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Rédaction en cours...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="h-3.5 w-3.5" />
                    Structurer l'offre
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Output Dashboard Column */}
        <div className="lg:col-span-8">
          {error && (
            <div className="bg-red-950/30 border border-red-900/40 rounded-xl p-5 mb-6 text-red-300 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block mb-1 text-sm">Échec de la rédaction web</span>
                <p className="text-xs text-red-400/90">{error}</p>
              </div>
            </div>
          )}

          {loading && (
            <div className="bg-[#0c0c0c] border border-white/5 rounded-xl p-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="h-12 w-12 rounded-full border-t-2 border-cyan-500 animate-spin"></div>
                <FileText className="h-5 w-5 text-cyan-400 absolute inset-0 m-auto animate-pulse" />
              </div>
              <div className="space-y-1">
                <p className="text-white font-medium text-sm">L'IA applique les règles du Copywriting AIDA...</p>
                <p className="text-slate-500 text-[10px] font-mono uppercase tracking-widest">Création de la structure de conversion et optimisation SEO</p>
              </div>
            </div>
          )}

          {!generatedData && !loading && !error && (
            <div className="bg-black/20 border-2 border-dashed border-white/5 rounded-xl p-12 text-center">
              <FileText className="h-10 w-10 text-slate-700 mx-auto mb-4" />
              <h3 className="text-white font-medium text-sm uppercase tracking-wider font-display">Aucune structure d'offre rédigée</h3>
              <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto">
                Soumets ton idée projet pour obtenir la structure d'une Landing Page optimisée avec copywriting d'impact.
              </p>
            </div>
          )}

          {generatedData && (
            <div className="space-y-6">
              {/* Toolbar */}
              <div className="flex justify-between items-center bg-[#0c0c0c] p-4 border border-white/5 rounded-xl">
                <span className="text-xs text-slate-550 font-mono">
                  Concept structuré • Cadre UX : <span className="text-cyan-400 font-medium font-sans">AIDA & SEO</span>
                </span>
                <button
                  onClick={handleSaveItem}
                  disabled={saved}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors border ${
                    saved
                      ? "bg-emerald-950/20 text-emerald-400 border border-emerald-800/40 pointer-events-none"
                      : "bg-white/5 hover:bg-cyan-500/10 text-cyan-400 border border-white/5 hover:border-cyan-500/20 cursor-pointer"
                  }`}
                >
                  <Bookmark className="h-3.5 w-3.5" />
                  {saved ? "Sauvegardé dans la bibliothèque" : "Sauvegarder le plan rédigé"}
                </button>
              </div>

              {/* 1. Landing Page Section - Hero */}
              <div className="bg-[#0c0c0c] border border-white/5 rounded-xl p-6 relative shadow-md space-y-4">
                <div className="flex justify-between items-start border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-cyan-950 border border-cyan-800/30 text-cyan-400 rounded-md text-[9px] font-mono tracking-wider">HERO SECTION</span>
                    <h3 className="text-white font-bold text-sm tracking-wider uppercase font-display">Section Hero (Tête de Page)</h3>
                  </div>
                  <button
                    onClick={() => copyText(`Titre: ${generatedData.hero.title}\nDescription: ${generatedData.hero.content}\nCTA: ${generatedData.hero.ctaText}`, "hero")}
                    className="text-[10px] uppercase font-mono text-slate-500 hover:text-white flex items-center gap-1.5 transition-colors border border-white/5 bg-black hover:bg-white/5 px-2.5 py-1 rounded"
                  >
                    {copiedField === "hero" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedField === "hero" ? "Copié" : "Copier"}
                  </button>
                </div>
                <div className="space-y-4 pt-1">
                  <div>
                    <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 font-mono">Titre Principal</span>
                    <p className="text-white text-lg font-bold font-display leading-snug">{generatedData.hero.title}</p>
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 font-mono">Contenu (Proposition de Valeur)</span>
                    <p className="text-slate-300 text-xs leading-relaxed">{generatedData.hero.content}</p>
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2 font-mono">Appel à l'Action Principal</span>
                    <span className="inline-block px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90 text-white rounded text-xs font-semibold select-none shadow-[0_0_15px_rgba(255,107,0,0.35)] cursor-pointer">
                      {generatedData.hero.ctaText}
                    </span>
                  </div>
                  {generatedData.hero.tips && (
                    <div className="bg-black rounded-lg p-3 border border-white/5 mt-3 flex items-start gap-2">
                      <HelpCircle className="h-4 w-4 text-slate-650 flex-shrink-0 mt-0.5" />
                      <p className="text-[11px] text-slate-450 leading-relaxed font-mono"><span className="text-slate-300 font-semibold font-sans">Conseil UI :</span> {generatedData.hero.tips}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Features Grid */}
              <div className="bg-[#0c0c0c] border border-white/5 rounded-xl p-6 relative shadow-md space-y-4">
                <div className="border-b border-white/5 pb-3 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-cyan-950 border border-cyan-800/30 text-cyan-400 rounded-md text-[9px] font-mono tracking-wider">FEATURES GRID</span>
                    <h3 className="text-white font-bold text-sm tracking-wider uppercase font-display">Fonctionnalités & Intérêt d'Usage</h3>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                  {generatedData.features.map((feature, idx) => (
                    <div key={idx} className="bg-black border border-white/5 rounded-xl p-4 flex flex-col justify-between">
                      <div className="space-y-2">
                        <span className="text-cyan-400 font-mono text-xs font-semibold">0{idx + 1}</span>
                        <h4 className="text-white font-semibold text-xs uppercase tracking-wide font-sans">{feature.title}</h4>
                        <p className="text-slate-400 text-xs leading-relaxed font-sans">{feature.content}</p>
                      </div>
                      {feature.tips && (
                        <p className="text-[10px] text-cyan-400/80 border-t border-white/5 mt-4 pt-2 font-mono">💡 {feature.tips}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Finale CTA Card */}
              <div className="bg-[#0c0c0c] border border-white/5 rounded-xl p-6 relative shadow-md space-y-4">
                <div className="flex justify-between items-start border-b border-white/5 pb-3">
                  <h3 className="text-white font-bold text-sm tracking-wider uppercase font-display flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-cyan-950 border border-cyan-800/30 text-cyan-400 rounded-md text-[9px] font-mono tracking-wider">CTA CONVERSION</span>
                    Appel à l'Action final (Pied de Page)
                  </h3>
                </div>
                <div className="bg-black border border-white/5 rounded-xl p-5 space-y-3">
                  <h4 className="text-white font-bold text-xs font-mono uppercase tracking-wide">{generatedData.cta.title}</h4>
                  <p className="text-slate-300 text-xs leading-relaxed">{generatedData.cta.content}</p>
                  <div className="pt-2">
                    <span className="inline-block px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded text-xs font-semibold select-none shadow">
                      {generatedData.cta.ctaText}
                    </span>
                  </div>
                </div>
              </div>

              {/* 4. Complete SEO Metadata tags */}
              <div className="bg-[#0c0c0c] border border-white/5 rounded-xl p-6 relative shadow-md space-y-4">
                <div className="border-b border-white/5 pb-3">
                  <h3 className="text-white font-bold text-sm tracking-wider uppercase font-display flex items-center gap-2">
                    <Globe className="h-5 w-5 text-cyan-400" /> Metas SEO & Référencement
                  </h3>
                </div>
                <div className="space-y-4 pt-1 text-xs bg-black p-4 border border-white/5 rounded-xl font-mono">
                  {/* SEO Title */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">SEO Title Tag</span>
                      <button
                        onClick={() => copyText(generatedData.seoTitle, "seoTitle")}
                        className="text-[10px] text-cyan-400 hover:text-cyan-350 transition-colors uppercase font-mono"
                      >
                        {copiedField === "seoTitle" ? "Copié !" : "Copier"}
                      </button>
                    </div>
                    <p className="text-cyan-400 font-semibold">{generatedData.seoTitle}</p>
                  </div>

                  {/* SEO Description */}
                  <div className="space-y-1 border-t border-white/5 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Meta Description (150-160 chars)</span>
                      <button
                        onClick={() => copyText(generatedData.seoDescription, "seoDescription")}
                        className="text-[10px] text-cyan-400 hover:text-cyan-350 transition-colors uppercase font-mono"
                      >
                        {copiedField === "seoDescription" ? "Copié !" : "Copier"}
                      </button>
                    </div>
                    <p className="text-slate-300 select-all leading-relaxed">{generatedData.seoDescription}</p>
                  </div>

                  {/* SEO Keywords */}
                  <div className="space-y-2 border-t border-white/5 pt-3">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Mots-clés stratégiques</span>
                    <div className="flex flex-wrap gap-2">
                      {generatedData.keywords.map((kw, idx) => (
                        <span key={idx} className="bg-white/5 py-1 px-2.5 rounded text-[10px] text-slate-300 border border-white/5 font-mono">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. Ads hooks */}
              <div className="bg-[#0c0c0c] border border-white/5 rounded-xl p-6 relative shadow-md space-y-4">
                <div className="border-b border-white/5 pb-3 flex items-center gap-2">
                  <Volume2 className="h-5 w-5 text-cyan-400" />
                  <h3 className="text-white font-bold text-sm tracking-wider uppercase font-display">Hooks Publicitaires & Slogans</h3>
                </div>
                <div className="space-y-3 pt-1">
                  {generatedData.hooks.map((hook, idx) => (
                    <div key={idx} className="flex justify-between items-start gap-4 p-3 bg-black border border-white/5 hover:border-cyan-500/20 rounded-lg transition-colors group">
                      <div className="flex gap-3">
                        <span className="font-mono text-cyan-400 select-none text-xs">H{idx+1}</span>
                        <p className="text-xs text-slate-300 font-sans italic">"{hook}"</p>
                      </div>
                      <button
                        onClick={() => copyText(hook, `hook_${idx}`)}
                        className="text-xs text-slate-500 hover:text-white transition-colors shrink-0"
                      >
                        {copiedField === `hook_${idx}` ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Sparkles local icon component wrapper to avoid import errors
function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1-1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5 5 3Z" />
      <path d="m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1 1-2.5Z" />
    </svg>
  );
}
