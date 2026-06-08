import React, { useState } from "react";
import { Send, Copy, Check, Sparkles, Linkedin, Twitter, Instagram, Bookmark, RefreshCw, AlertTriangle } from "lucide-react";
import { SocialPost } from "../types";

interface SocialHubProps {
  onSave: (type: 'social', title: string, data: any) => void;
}

export default function SocialHub({ onSave }: SocialHubProps) {
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("Professionnel & Inspirant");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [postData, setPostData] = useState<SocialPost | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const tones = [
    "Professionnel & Inspirant",
    "Percutant & Direct",
    "Tech-savvy & Moderne",
    "Casual & Décontracté",
    "Viral & Créatif",
    "Humoristique & Décalé"
  ];

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    setError(null);
    setPostData(null);
    setSaved(false);

    try {
      const response = await fetch("/api/generate-social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, tone }),
      });

      if (!response.ok) {
        const errObj = await response.json();
        throw new Error(errObj.error || "Une erreur est survenue lors de la génération.");
      }

      const result = await response.json();
      if (result.success && result.data) {
        setPostData({
          id: Date.now().toString(),
          topic,
          tone,
          linkedin: result.data.linkedin,
          twitter: result.data.twitter,
          instagram: result.data.instagram,
          createdAt: new Date().toISOString(),
        });
      } else {
        throw new Error("Format de réponse de l'API invalide.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Impossible de joindre le serveur de génération.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSaveItem = () => {
    if (!postData) return;
    const cleanTitle = postData.topic.length > 25 
      ? postData.topic.substring(0, 25) + "..." 
      : postData.topic;
    onSave('social', `Social: ${cleanTitle}`, postData);
    setSaved(true);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <h1 className="text-2xl font-light tracking-tight text-white flex items-center gap-2 font-display">
            <Sparkles className="h-6 w-6 text-cyan-400" />
            SOCIAL HUB & PERSONAL BRANDING
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Génère instantanément tes posts pour LinkedIn, X (Twitter) et Instagram.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Control Column */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#0c0c0c] border border-white/5 rounded-xl p-6 shadow-md">
            <h2 className="text-sm font-semibold tracking-wider text-white uppercase font-display mb-4 flex items-center gap-2">
              <Sparkles className="h-4.5 w-4.5 text-cyan-400" /> Paramètres du Post
            </h2>
            <form onSubmit={handleGenerate} className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 font-mono">
                  Sujet ou URL du Projet
                </label>
                <textarea
                  className="w-full bg-black border border-white/5 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-cyan-500/50 placeholder-slate-650 transition-colors font-mono"
                  rows={4}
                  placeholder="Ex: Je viens de lancer handCode, une plateforme pour les solo-devs. Elle permet d'agencer des layouts en SVG hyper légers..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 font-mono">
                  Ton de voix (Tone of Voice)
                </label>
                <div className="grid grid-cols-1 gap-1.5">
                  {tones.map((t) => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setTone(t)}
                      className={`text-left px-4 py-2 rounded-lg text-xs transition-all border ${
                        tone === t
                          ? "bg-cyan-500/10 border-cyan-500/30 text-white font-medium"
                          : "bg-black border-white/5 text-slate-400 hover:border-slate-700 hover:text-white"
                      }`}
                      disabled={loading}
                    >
                      {t}
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
                    Rédaction en cours...
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    Générer les posts
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Output Column */}
        <div className="lg:col-span-8">
          {error && (
            <div className="bg-red-950/30 border border-red-900/40 rounded-xl p-5 mb-6 text-red-500 flex items-start gap-4">
              <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-3">
                <div>
                  <span className="font-semibold block mb-1 text-sm text-red-200">Échec de la génération</span>
                  <p className="text-xs text-red-300 leading-relaxed font-sans">
                    {error.includes("503") || error.includes("high demand") || error.includes("UNAVAILABLE")
                      ? "Le serveur de génération de l'API Gemini subit un volume élevé d'appels. Veuillez réessayer."
                      : error}
                  </p>
                </div>
                <button
                  onClick={() => handleGenerate()}
                  className="px-4 py-2 rounded-lg bg-red-900/40 border border-red-700/50 hover:bg-red-800/60 text-red-200 font-mono text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 duration-100 uppercase tracking-wider"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Réessayer la génération
                </button>
              </div>
            </div>
          )}

          {loading && (
            <div className="bg-[#0c0c0c] border border-white/5 rounded-xl p-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="h-12 w-12 rounded-full border-t-2 border-cyan-500 animate-spin"></div>
                <Sparkles className="h-5 w-5 text-cyan-400 absolute inset-0 m-auto animate-pulse" />
              </div>
              <div className="space-y-1">
                <p className="text-white font-medium text-sm">L'IA rédige vos publications...</p>
                <p className="text-slate-500 text-[10px] font-mono uppercase tracking-wider">Application du ton : {tone}</p>
              </div>
            </div>
          )}

          {!postData && !loading && !error && (
            <div className="bg-black/20 border-2 border-dashed border-white/5 rounded-xl p-12 text-center">
              <Sparkles className="h-10 w-10 text-slate-700 mx-auto mb-4" />
              <h3 className="text-white font-medium text-sm uppercase tracking-wider font-display">Aucune génération en cours</h3>
              <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto">
                Remplis les détails à gauche et déclenche l'IA pour générer ton contenu pour les réseaux.
              </p>
            </div>
          )}

          {postData && (
            <div className="space-y-6">
              {/* Toolbar */}
              <div className="flex justify-between items-center bg-[#0c0c0c] p-4 border border-white/5 rounded-xl">
                <span className="text-xs text-slate-500 font-mono">
                  Généré avec succès • Ton : <span className="text-cyan-400 font-medium font-sans">{postData.tone}</span>
                </span>
                <button
                  onClick={handleSaveItem}
                  disabled={saved}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors border ${
                    saved
                      ? "bg-emerald-950/20 text-emerald-400 border-emerald-800/40 pointer-events-none font-mono"
                      : "bg-white/5 hover:bg-cyan-500/10 text-cyan-400 border border-white/5 hover:border-cyan-500/20 cursor-pointer font-mono"
                  }`}
                >
                  <Bookmark className="h-3.5 w-3.5" />
                  {saved ? "Enregistré dans la bibliothèque" : "Sauvegarder les posts"}
                </button>
              </div>

              {/* LinkedIn Post Card */}
              <div className="bg-[#0c0c0c] border border-white/5 rounded-xl overflow-hidden shadow-md">
                <div className="border-b border-white/5 p-4 flex justify-between items-center bg-black/40">
                  <span className="flex items-center gap-2 text-xs font-semibold text-cyan-400 font-mono">
                    <Linkedin className="h-4.5 w-4.5 fill-cyan-400 text-cyan-400" />
                    LINKEDIN COMMUNIQUE
                  </span>
                  <button
                    onClick={() => copyToClipboard(postData.linkedin, "linkedin")}
                    className="flex items-center gap-1.5 text-[10px] uppercase font-mono text-slate-500 hover:text-white px-2.5 py-1.5 rounded-md border border-white/5 bg-black hover:bg-white/5 transition-colors"
                  >
                    {copiedField === "linkedin" ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-400" />
                        Copié !
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        Copier
                      </>
                    )}
                  </button>
                </div>
                <div className="p-5 font-sans text-xs text-slate-300 whitespace-pre-line leading-relaxed selection:bg-cyan-550/30">
                  {postData.linkedin}
                </div>
              </div>

              {/* Twitter Post Card */}
              <div className="bg-[#0c0c0c] border border-white/5 rounded-xl overflow-hidden shadow-md">
                <div className="border-b border-white/5 p-4 flex justify-between items-center bg-black/40">
                  <span className="flex items-center gap-2 text-xs font-semibold text-cyan-400 font-mono">
                    <Twitter className="h-4.5 w-4.5 fill-cyan-400 text-cyan-400" />
                    TWITTER / X FEED
                  </span>
                  <button
                    onClick={() => copyToClipboard(postData.twitter, "twitter")}
                    className="flex items-center gap-1.5 text-[10px] uppercase font-mono text-slate-500 hover:text-white px-2.5 py-1.5 rounded-md border border-white/5 bg-black hover:bg-white/5 transition-colors"
                  >
                    {copiedField === "twitter" ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-400" />
                        Copié !
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        Copier
                      </>
                    )}
                  </button>
                </div>
                <div className="p-5 font-sans text-xs text-slate-300 whitespace-pre-line leading-relaxed selection:bg-cyan-550/30">
                  {postData.twitter}
                </div>
              </div>

              {/* Instagram Post Card */}
              <div className="bg-[#0c0c0c] border border-white/5 rounded-xl overflow-hidden shadow-md">
                <div className="border-b border-white/5 p-4 flex justify-between items-center bg-black/40">
                  <span className="flex items-center gap-2 text-xs font-semibold text-cyan-400 font-mono">
                    <Instagram className="h-4.5 w-4.5" />
                    INSTAGRAM CONCEPT
                  </span>
                  <button
                    onClick={() => copyToClipboard(postData.instagram, "instagram")}
                    className="flex items-center gap-1.5 text-[10px] uppercase font-mono text-slate-500 hover:text-white px-2.5 py-1.5 rounded-md border border-white/5 bg-black hover:bg-white/5 transition-colors"
                  >
                    {copiedField === "instagram" ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-400" />
                        Copié !
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        Copier
                      </>
                    )}
                  </button>
                </div>
                <div className="p-5 font-sans text-xs text-slate-300 whitespace-pre-line leading-relaxed selection:bg-cyan-550/30">
                  {postData.instagram}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
