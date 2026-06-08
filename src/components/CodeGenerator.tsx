import React, { useState } from "react";
import { Send, Copy, Check, Code2, BookOpen, Eye, Play, Bookmark, RefreshCw, AlertTriangle, Terminal } from "lucide-react";
import { CodeSnippet } from "../types";

interface CodeGeneratorProps {
  onSave: (type: 'code', title: string, data: any) => void;
}

export default function CodeGenerator({ onSave }: CodeGeneratorProps) {
  const [prompt, setPrompt] = useState("");
  const [language, setLanguage] = useState("Tailwind & HTML");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snippet, setSnippet] = useState<CodeSnippet | null>(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'code' | 'preview' | 'explanation'>('code');

  const languages = [
    "Tailwind & HTML",
    "React (TypeScript)",
    "Vanilla JS Animation",
    "Modern PHP 8 Module",
    "PostgreSQL / SQL Migration",
    "CSS Micro-interactions"
  ];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    setSnippet(null);
    setSaved(false);
    setActiveTab('code');

    try {
      const response = await fetch("/api/generate-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, language }),
      });

      if (!response.ok) {
        const errObj = await response.json();
        throw new Error(errObj.error || "Une erreur est survenue lors de la génération.");
      }

      const result = await response.json();
      if (result.success && result.data) {
        setSnippet({
          id: Date.now().toString(),
          title: prompt.length > 30 ? prompt.substring(0, 30) + "..." : prompt,
          prompt,
          language,
          code: result.data.code,
          explanation: result.data.explanation,
          createdAt: new Date().toISOString()
        });
      } else {
        throw new Error("Format de réponse de l'API erroné.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Impossible de joindre le serveur de génération de code.");
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    if (!snippet) return;
    navigator.clipboard.writeText(snippet.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveItem = () => {
    if (!snippet) return;
    onSave('code', `Code: ${snippet.title}`, snippet);
    setSaved(true);
  };

  const getPreviewHtml = (rawCode: string) => {
    const isRenderable = language === "Tailwind & HTML" || language === "Vanilla JS Animation" || language === "CSS Micro-interactions";
    
    if (!isRenderable) {
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>body { background-color: #030303; color: #64748b; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }</style>
        </head>
        <body>
          <div class="p-6">
            <svg class="h-10 w-10 text-cyan-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            <p class="font-medium text-white">Aperçu Impossible pour ${language}</p>
            <p class="text-xs text-slate-500 mt-1">L'aperçu en temps réel est réservé aux langages d'interface (HTML, CSS, JS, Tailwind).</p>
          </div>
        </body>
        </html>
      `;
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <script>
          tailwind.config = {
            theme: {
              extend: {
                fontFamily: {
                  sans: ['"Plus Jakarta Sans"', 'sans-serif'],
                }
              }
            }
          }
        </script>
        <style>
          body {
            background-color: #030303;
            color: #cbd5e1;
            font-family: 'Plus Jakarta Sans', sans-serif;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            margin: 0;
            overflow-x: hidden;
          }
          /* Custom scroll bar inside sandbox */
          ::-webkit-scrollbar { width: 5px; height: 5px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: rgba(255, 107, 0, 0.2); border-radius: 99px; }
        </style>
      </head>
      <body>
        <div class="w-full flex justify-center items-center">
          ${rawCode}
        </div>
      </body>
      </html>
    `;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <h1 className="text-2xl font-light tracking-tight text-white flex items-center gap-2 font-display">
            <Code2 className="h-6 w-6 text-cyan-400" />
            SMART SNIPPET & COMPONENT GENERATOR
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Génère des blocs de code Tailwind réutilisables, des scripts PHP, SQL ou React, et prévisualise-les en temps réel.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Paramètres Column */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#0c0c0c] border border-white/5 rounded-xl p-6 shadow-md">
            <h2 className="text-sm font-semibold text-white tracking-wider uppercase font-display mb-4 flex items-center gap-2">
              <Terminal className="h-4.5 w-4.5 text-cyan-400" /> Spécifications
            </h2>
            <form onSubmit={handleGenerate} className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 font-mono">
                  Que voulez-vous coder ?
                </label>
                <textarea
                  className="w-full bg-black border border-white/5 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-cyan-500/50 placeholder-slate-650 transition-colors font-mono"
                  rows={4}
                  placeholder="Ex: Un bouton switch animé de transition darkmode avec un bouton lune & soleil en Tailwind CSS, avec effet de lueur..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 font-mono">
                  Environnement standard
                </label>
                <div className="grid grid-cols-1 gap-1.5">
                  {languages.map((l) => (
                    <button
                      type="button"
                      key={l}
                      onClick={() => setLanguage(l)}
                      className={`text-left px-4 py-2 rounded-lg text-xs transition-all border ${
                        language === l
                          ? "bg-cyan-500/10 border-cyan-500/30 text-white font-medium"
                          : "bg-black border-white/5 text-slate-400 hover:border-slate-700 hover:text-white"
                      }`}
                      disabled={loading}
                    >
                      {l}
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
                    Rédaction de code...
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5" />
                    Générer le code
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Console / Output Column */}
        <div className="lg:col-span-8">
          {error && (
            <div className="bg-red-950/30 border border-red-900/40 rounded-xl p-5 mb-6 text-red-400 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block mb-1 text-sm">Erreur de compilation</span>
                <p className="text-xs text-red-450">{error}</p>
              </div>
            </div>
          )}

          {loading && (
            <div className="bg-[#0c0c0c] border border-white/5 rounded-xl p-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="h-12 w-12 rounded-full border-t-2 border-cyan-500 animate-spin"></div>
                <Code2 className="h-5 w-5 text-cyan-400 absolute inset-0 m-auto animate-pulse" />
              </div>
              <div className="space-y-1">
                <p className="text-white font-medium text-sm">L'IA assemble le code demandé...</p>
                <p className="text-slate-500 text-[10px] font-mono uppercase tracking-widest">Génération en cours pour : {language}</p>
              </div>
            </div>
          )}

          {!snippet && !loading && !error && (
            <div className="bg-black/20 border-2 border-dashed border-white/5 rounded-xl p-12 text-center">
              <Code2 className="h-10 w-10 text-slate-700 mx-auto mb-4" />
              <h3 className="text-white font-medium text-sm uppercase tracking-wider font-display">Aucun code généré</h3>
              <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto">
                Spécifie ton besoin technique et lance l'IA pour générer ton composant ou snippet réutilisable.
              </p>
            </div>
          )}

          {snippet && (
            <div className="space-y-6">
              {/* Output Menu Toolbar */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-[#0c0c0c] p-4 border border-white/5 rounded-xl gap-4">
                <div className="flex gap-1.5 bg-black p-1 rounded-lg border border-white/5">
                  <button
                    onClick={() => setActiveTab('code')}
                    className={`px-3 py-1.5 rounded-md text-[10px] uppercase font-mono tracking-wider transition-colors flex items-center gap-1.5 ${
                      activeTab === 'code'
                        ? "bg-cyan-500/10 border border-cyan-500/20 text-cyan-400"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Code2 className="h-3.5 w-3.5" />
                    Code Source
                  </button>
                  <button
                    onClick={() => setActiveTab('preview')}
                    className={`px-3 py-1.5 rounded-md text-[10px] uppercase font-mono tracking-wider transition-colors flex items-center gap-1.5 ${
                      activeTab === 'preview'
                        ? "bg-cyan-500/10 border border-cyan-500/20 text-cyan-400"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Rendu Interactif
                  </button>
                  <button
                    onClick={() => setActiveTab('explanation')}
                    className={`px-3 py-1.5 rounded-md text-[10px] uppercase font-mono tracking-wider transition-colors flex items-center gap-1.5 ${
                      activeTab === 'explanation'
                        ? "bg-cyan-500/10 border border-cyan-500/20 text-cyan-400"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    Explication
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={copyCode}
                    className="flex items-center gap-1 px-3 py-1.5 bg-white/5 hover:bg-cyan-500/10 text-cyan-400 hover:text-cyan-400 border border-white/5 hover:border-cyan-500/20 active:scale-[0.97] transition-all text-xs rounded-lg cursor-pointer font-mono"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        Copié !
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        Copier le code
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleSaveItem}
                    disabled={saved}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors border ${
                      saved
                        ? "bg-emerald-950/20 text-emerald-400 border-emerald-800/40 pointer-events-none"
                        : "bg-white/5 hover:bg-cyan-500/10 text-cyan-400 border border-white/5 hover:border-cyan-500/20 cursor-pointer"
                    }`}
                  >
                    <Bookmark className="h-3.5 w-3.5" />
                    {saved ? "Enregistré" : "Sauvegarder"}
                  </button>
                </div>
              </div>

              {/* Central Output Screens */}
              <div className="bg-[#0c0c0c] border border-white/5 rounded-xl overflow-hidden shadow-md min-h-[400px] flex flex-col">
                
                {/* 1. Code View */}
                {activeTab === 'code' && (
                  <div className="flex-1 flex flex-col font-mono text-xs">
                    <div className="bg-black/45 px-4 py-2 border-b border-white/5 flex items-center justify-between text-slate-550 select-none font-mono">
                      <span>{snippet.language}</span>
                      <span>UTF-8</span>
                    </div>
                    <pre className="flex-1 p-5 overflow-auto bg-black text-cyan-100 leading-relaxed selection:bg-cyan-500/30 whitespace-pre-wrap font-mono">
                      <code>{snippet.code}</code>
                    </pre>
                  </div>
                )}

                {/* 2. Interactive Preview */}
                {activeTab === 'preview' && (
                  <div className="flex-1 flex flex-col bg-[#030303]">
                    <div className="bg-black/45 px-4 py-2 border-b border-white/5 flex items-center gap-2 text-[10px] font-mono text-slate-500 select-none uppercase">
                      <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                      <span>Bac à sable instantané (Iframe isolée)</span>
                    </div>
                    <div className="flex-1 min-h-[350px] relative bg-[#030303] flex">
                      <iframe
                        className="w-full h-full border-none min-h-[360px]"
                        srcDoc={getPreviewHtml(snippet.code)}
                        title="Render Preview"
                        sandbox="allow-scripts"
                      />
                    </div>
                  </div>
                )}

                {/* 3. Explanation Tab */}
                {activeTab === 'explanation' && (
                  <div className="flex-1 p-6 space-y-4">
                    <h3 className="text-white font-medium text-xs font-mono uppercase tracking-widest flex items-center gap-1.5 border-b border-white/5 pb-3">
                      <BookOpen className="h-4.5 w-4.5 text-cyan-400" />
                      Notice Technique d'intégration
                    </h3>
                    <div className="text-xs font-mono text-slate-400 leading-relaxed whitespace-pre-line bg-black p-4 rounded-xl border border-white/5">
                      {snippet.explanation}
                    </div>
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
