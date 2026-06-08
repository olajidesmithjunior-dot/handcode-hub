import React, { useState } from "react";
import { Send, Copy, Check, Palette, FileCode, ImageIcon, Bookmark, RefreshCw, AlertTriangle, Download, Sparkles } from "lucide-react";
import { DesignAsset } from "../types";

interface DesignAssetsProps {
  onSave: (type: 'design', title: string, data: any) => void;
}

export default function DesignAssets({ onSave }: DesignAssetsProps) {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("Glassmorphic Dark Neon");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [design, setDesign] = useState<DesignAsset | null>(null);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'visual' | 'code' | 'midjourney'>('visual');

  const styles = [
    "Glassmorphic Dark Neon",
    "Swiss Minimalist Off-white",
    "Neo Cyberpunk Terminal",
    "Organic Warm Earth",
    "Brutalist Monochrome",
    "Luxury Gold & Obsidian"
  ];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    setDesign(null);
    setSaved(false);
    setActiveTab('visual');

    try {
      const response = await fetch("/api/generate-design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, style }),
      });

      if (!response.ok) {
        const errObj = await response.json();
        throw new Error(errObj.error || "Une erreur est survenue lors de la génération graphique.");
      }

      const result = await response.json();
      if (result.success && result.data) {
        setDesign({
          id: Date.now().toString(),
          prompt,
          style: result.data.styleName || style,
          palette: result.data.palette,
          fontPairing: result.data.fontPairing,
          midjourneyPrompt: result.data.midjourneyPrompt,
          svgIcon: result.data.svgIcon,
          createdAt: new Date().toISOString()
        });
      } else {
        throw new Error("L'API a renvoyé des données incorrectes.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Impossible de joindre le serveur de création de ressources.");
    } finally {
      setLoading(false);
    }
  };

  const copyHex = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedColor(hex);
    setTimeout(() => setCopiedColor(null), 1500);
  };

  const copyFieldText = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSaveItem = () => {
    if (!design) return;
    const cleanTitle = design.prompt.length > 25 
      ? design.prompt.substring(0, 25) + "..." 
      : design.prompt;
    onSave('design', `Design: ${cleanTitle}`, design);
    setSaved(true);
  };

  const downloadSvg = () => {
    if (!design || !design.svgIcon) return;
    const blob = new Blob([design.svgIcon], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `artisan_vector_${design.id}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <h1 className="text-2xl font-light tracking-tight text-white flex items-center gap-2 font-display">
            <Palette className="h-6 w-6 text-cyan-400" />
            MOODBOARD & DESIGNER ASSETS
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Génère des palettes de couleurs premium, des inspirations de typographies, des prompts Midjourney et un asset vectoriel SVG unique à exploiter.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Paramètres Column */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#0c0c0c] border border-white/5 rounded-xl p-6 shadow-md">
            <h2 className="text-sm font-semibold text-white tracking-wider uppercase font-display mb-3 flex items-center gap-2">
              <ImageIcon className="h-4.5 w-4.5 text-cyan-400" /> Identité Créative
            </h2>
            <p className="text-slate-500 text-[11px] mb-5 leading-relaxed font-mono">
              Formule l'esprit de l'identité que tu souhaites créer (ex: "SaaS de dev", "Logo abstrait de fusée", "Badge scandinave minimalist").
            </p>
            <form onSubmit={handleGenerate} className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 font-mono">
                  Concept Graphique / Icône
                </label>
                <textarea
                  className="w-full bg-black border border-white/5 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-cyan-500/50 placeholder-slate-650 transition-colors font-mono"
                  rows={4}
                  placeholder="Ex: Une icône minimaliste d'engrenage organique fusionné avec un code de balise ou un processeur graphique, pour un écosystème de dev solo..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 font-mono">
                  Ligne esthétique (Preset)
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {styles.map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setStyle(s)}
                      className={`text-left px-3 py-2 rounded-lg text-xs transition-all border ${
                        style === s
                          ? "bg-cyan-500/10 border-cyan-500/30 text-white font-medium"
                          : "bg-black border-white/5 text-slate-400 hover:border-slate-700 hover:text-white"
                      }`}
                      disabled={loading}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-white text-black hover:bg-cyan-400 hover:text-black font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg hover:shadow-[0_0_15px_rgba(34,211,238,0.25)] active:scale-[0.98] text-xs uppercase tracking-widest font-mono"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Création d'asset...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                    Générer l'Asset
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Assets Panel Column */}
        <div className="lg:col-span-8">
          {error && (
            <div className="bg-red-950/30 border border-red-900/40 rounded-xl p-5 mb-6 text-red-00 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block mb-1 text-sm">Erreur de création SVG / Graphique</span>
                <p className="text-xs text-red-400/90">{error}</p>
              </div>
            </div>
          )}

          {loading && (
            <div className="bg-[#0c0c0c] border border-white/5 rounded-xl p-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="h-12 w-12 rounded-full border-t-2 border-cyan-500 animate-spin"></div>
                <Palette className="h-5 w-5 text-cyan-400 absolute inset-0 m-auto animate-pulse" />
              </div>
              <div className="space-y-1">
                <p className="text-white font-medium text-sm">L'IA est en train d'esquisser le design vectoriel...</p>
                <p className="text-slate-500 text-[10px] font-mono uppercase tracking-widest">Harmonisation de la palette et codage de l'icône SVG</p>
              </div>
            </div>
          )}

          {!design && !loading && !error && (
            <div className="bg-black/20 border-2 border-dashed border-white/5 rounded-xl p-12 text-center">
              <Palette className="h-10 w-10 text-slate-700 mx-auto mb-4" />
              <h3 className="text-white font-medium text-sm uppercase tracking-wider font-display">Aucun projet graphique rédigé</h3>
              <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto">
                Spécifie ton concept visuel à gauche pour obtenir un ensemble de design complet d'inspiration et ton SVG prêt à l'emploi.
              </p>
            </div>
          )}

          {design && (
            <div className="space-y-6">
              {/* Toolbar */}
              <div className="flex justify-between items-center bg-[#0c0c0c] p-4 border border-white/5 rounded-xl">
                <span className="text-xs text-slate-550 font-mono">
                  Style consolidé • Gamme : <span className="text-cyan-400 font-medium font-sans">{design.style}</span>
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
                  {saved ? "Sauvegardé" : "Sauvegarder l'identité visuelle"}
                </button>
              </div>

              {/* 1. Interactive Color Palette Card */}
              <div className="bg-[#0c0c0c] border border-white/5 rounded-xl p-6 shadow-md space-y-4">
                <h3 className="text-white font-bold text-xs uppercase tracking-wider font-mono border-b border-white/5 pb-3 flex items-center gap-2">
                  <Palette className="h-4.5 w-4.5 text-cyan-400" /> Palette de Couleurs Harmonisée (Hex)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
                  {design.palette.map((color, idx) => (
                    <button
                      key={idx}
                      onClick={() => copyHex(color.hex)}
                      className="group flex flex-col text-left bg-black hover:bg-[#080808] border border-white/5 hover:border-slate-850 rounded-xl p-3 relative cursor-pointer active:scale-[0.98] transition-all"
                    >
                      <div className="h-12 w-full rounded-lg mb-2 shadow" style={{ backgroundColor: color.hex }} />
                      <div className="space-y-0.5 min-w-0 font-mono">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block truncate">{color.role}</span>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-300">{color.hex}</span>
                          <span className="text-[10px] text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">Copy</span>
                        </div>
                      </div>
                      {copiedColor === color.hex && (
                        <div className="absolute inset-0 bg-black rounded-xl flex flex-col items-center justify-center text-emerald-400 text-xs font-bold animate-fade-in font-mono border border-emerald-800/20">
                          <Check className="h-4 w-4 mb-1" /> Copié !
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Typo integration */}
              <div className="bg-[#0c0c0c] border border-white/5 rounded-xl p-6 shadow-md space-y-4">
                <h3 className="text-white font-bold text-xs uppercase tracking-wider font-mono border-b border-white/5 pb-3">
                  Suggestion Typographique & Pairings
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-white/5 font-mono">
                  <div className="space-y-1.5">
                    <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">Fonts Titres / Display</span>
                    <p className="text-white text-base font-bold font-display" style={{ fontFamily: design.fontPairing.header }}>
                      {design.fontPairing.header}
                    </p>
                    <p className="text-xs text-slate-400 font-sans">Idéal pour les grands titres, bannières et cartes du dashboard.</p>
                  </div>
                  <div className="space-y-1.5 pt-4 sm:pt-0 sm:pl-6">
                    <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">Fonts Paragraphes / Body</span>
                    <p className="text-white text-sm" style={{ fontFamily: design.fontPairing.body }}>
                      {design.fontPairing.body}
                    </p>
                    <p className="text-xs text-slate-400 font-sans">Idéal pour les descriptions d'articles, textes longs d'assistance.</p>
                  </div>
                </div>
              </div>

              {/* 3. Output Display of SVG Vector & Raw Source tabs */}
              <div className="bg-[#0c0c0c] border border-white/5 rounded-xl overflow-hidden shadow-md min-h-[420px] flex flex-col">
                <div className="bg-black/60 px-4 py-3 border-b border-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex gap-2 bg-black p-1 rounded-lg border border-white/5 self-start">
                    <button
                      onClick={() => setActiveTab('visual')}
                      className={`px-3 py-1.5 rounded-md text-[10px] uppercase font-mono tracking-wider transition-colors flex items-center gap-1.5 ${
                        activeTab === 'visual' ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/25" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Vectoriel Rendu
                    </button>
                    <button
                      onClick={() => setActiveTab('code')}
                      className={`px-3 py-1.5 rounded-md text-[10px] uppercase font-mono tracking-wider transition-colors flex items-center gap-1.5 ${
                        activeTab === 'code' ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/25" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <FileCode className="h-3.5 w-3.5" />
                      Code Source SVG
                    </button>
                    <button
                      onClick={() => setActiveTab('midjourney')}
                      className={`px-3 py-1.5 rounded-md text-[10px] uppercase font-mono tracking-wider transition-colors flex items-center gap-1.5 ${
                        activeTab === 'midjourney' ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/25" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Midjourney prompt
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {activeTab === 'code' && (
                      <button
                        onClick={() => copyFieldText(design.svgIcon || "", "svgCode")}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-white/5 hover:bg-cyan-500/10 border border-white/5 hover:border-cyan-500/20 active:scale-[0.98] rounded text-[10px] text-cyan-400 hover:text-cyan-400 transition-all cursor-pointer font-mono"
                      >
                        {copiedField === "svgCode" ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                            Copié !
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            Copier XML
                          </>
                        )}
                      </button>
                    )}
                    {design.svgIcon && (
                      <button
                        onClick={downloadSvg}
                        className="flex items-center gap-1 px-3 py-1.5 bg-white text-black hover:bg-cyan-400 hover:text-black active:scale-[0.98] rounded text-xs font-bold transition-all shadow cursor-pointer font-mono uppercase tracking-widest"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Télécharger .svg
                      </button>
                    )}
                  </div>
                </div>

                {/* Core Screens */}
                {activeTab === 'visual' && (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 bg-black relative overflow-hidden group">
                    <div className="w-full max-w-[280px] h-[280px] flex items-center justify-center z-10 select-none">
                      {design.svgIcon ? (
                        <div 
                          className="w-full h-full drop-shadow-[0_0_30px_rgba(34,211,238,0.3)] transition-transform duration-500 group-hover:scale-105"
                          dangerouslySetInnerHTML={{ __html: design.svgIcon }}
                        />
                      ) : (
                        <div className="text-slate-600 text-xs italic font-mono uppercase">Code SVG indisponible.</div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'code' && (
                  <div className="flex-1 flex flex-col font-mono text-xs">
                    <pre className="flex-1 p-5 overflow-auto bg-black text-cyan-200 leading-relaxed selection:bg-cyan-500/35 max-h-[350px]">
                      <code>{design.svgIcon}</code>
                    </pre>
                  </div>
                )}

                {activeTab === 'midjourney' && (
                  <div className="flex-1 p-6 space-y-4">
                    <div className="flex justify-between items-center border-b border-white/5 pb-3">
                      <h4 className="text-white font-medium text-xs font-mono uppercase tracking-widest">Prompt d'Asset Haute Fidélité pour Midjourney / Flux</h4>
                      <button
                        onClick={() => copyFieldText(design.midjourneyPrompt, "mjPrompt")}
                        className="text-[10px] text-cyan-400 hover:text-cyan-350 transition-colors uppercase font-mono"
                      >
                        {copiedField === "mjPrompt" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                        {copiedField === "mjPrompt" ? "Prompt copié" : "Copier le Prompt"}
                      </button>
                    </div>
                    <div className="bg-black p-4 border border-white/5 rounded-lg text-xs text-slate-300 font-mono leading-relaxed select-all">
                      {design.midjourneyPrompt}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-mono">
                      💡 Copie-colle ce prompt directement dans Discord (Midjourney) ou dans ton interface Flux.1 pour obtenir des assets 3D, bannières panoramiques ou illustrations d'arrière-plan haut de gamme coordonnés.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
