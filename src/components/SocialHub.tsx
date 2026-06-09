import React, { useState } from "react";
import { 
  Send, 
  Copy, 
  Check, 
  Sparkles, 
  Linkedin, 
  Twitter, 
  Instagram, 
  Bookmark, 
  RefreshCw, 
  AlertTriangle,
  ThumbsUp,
  MessageSquare,
  Share2,
  Globe,
  Heart,
  MoreHorizontal
} from "lucide-react";
import { SocialPost, BrandIdentity } from "../types";

interface SocialHubProps {
  onSave: (type: 'social', title: string, data: any) => void;
  brandIdentity?: BrandIdentity;
}

export default function SocialHub({ onSave, brandIdentity }: SocialHubProps) {
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("Professionnel & Inspirant");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [postData, setPostData] = useState<SocialPost | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Live mockup simulation states
  const [showLinkedInMockup, setShowLinkedInMockup] = useState(false);
  const [showTwitterMockup, setShowTwitterMockup] = useState(false);
  const [showInstagramMockup, setShowInstagramMockup] = useState(false);
  const [linkedInExpanded, setLinkedInExpanded] = useState(false);
  const [linkedinLiked, setLinkedinLiked] = useState(false);
  const [instagramLiked, setInstagramLiked] = useState(false);
  const [twitterLiked, setTwitterLiked] = useState(false);

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
                    LINKEDIN COMMUNIQUÉ
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowLinkedInMockup(!showLinkedInMockup)}
                      className={`text-[10px] uppercase font-mono px-3 py-1.5 rounded-md border transition-all cursor-pointer ${
                        showLinkedInMockup 
                          ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-400 font-bold"
                          : "bg-black border-white/5 text-slate-400 hover:text-white"
                      }`}
                    >
                      {showLinkedInMockup ? "Voir Brut 📄" : "Simuler Affichage 📱"}
                    </button>
                    <button
                      type="button"
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
                </div>

                {showLinkedInMockup ? (
                  /* HIGH FIDELITY LINKEDIN PROFILE PREVIEW - LIGHT MODE REALISTIC SIMULATION */
                  <div className="p-4 sm:p-6 bg-white text-slate-900 font-sans border-t border-[#dfdfdf]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex gap-2.5">
                        {/* Avatar */}
                        <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-slate-200 to-slate-300 border border-[#dfdfdf] flex items-center justify-center font-bold text-slate-700 uppercase shrink-0">
                          {brandIdentity?.brandPreset ? brandIdentity?.brandPreset.substring(0, 2).toUpperCase() : "HA"}
                        </div>
                        <div>
                          <div className="flex items-center gap-1">
                            <h4 className="font-semibold text-sm text-[14px] hover:text-[#0a66c2] hover:underline cursor-pointer leading-tight">
                              {brandIdentity?.brandPreset === "tech" ? "TechArtisan Studio" : (brandIdentity?.brandPreset === "consult" ? "ConsultPlus Solutions" : "HandCode Digital Artisan")}
                            </h4>
                            <span className="h-3.5 w-3.5 text-blue-600 bg-blue-100 rounded-full flex items-center justify-center font-bold text-[8px]" title="Vérifié">✔</span>
                            <span className="text-[11px] text-slate-500">• 1er</span>
                          </div>
                          <p className="text-[11.5px] text-slate-500 max-w-sm sm:max-w-md line-clamp-1 leading-normal">
                            {brandIdentity?.editorialTone ? `Sujet : ${brandIdentity.editorialTone} • Cible : ${brandIdentity.targetAudience?.substring(0, 30) || "Professionnels"}` : "Solo Entrepreneur & Full-stack creator"}
                          </p>
                          <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5 leading-none">
                            <span>1 h</span>
                            <span>•</span>
                            <Globe className="h-3 w-3 text-slate-400" />
                          </div>
                        </div>
                      </div>
                      <button type="button" className="text-slate-400 hover:bg-slate-100 p-1.5 rounded-full shrink-0">
                        <MoreHorizontal className="h-5 w-5" />
                      </button>
                    </div>

                    {/* Post Content */}
                    <div className="mt-3.5 text-[13.5px] text-slate-800 leading-relaxed font-normal whitespace-pre-line break-words">
                      {!linkedInExpanded && postData.linkedin.length > 260 ? (
                        <>
                          {postData.linkedin.substring(0, 260)}...
                          <button 
                            type="button"
                            onClick={() => setLinkedInExpanded(true)}
                            className="text-[#0a66c2] hover:underline font-bold ml-1 cursor-pointer"
                          >
                            voir plus
                          </button>
                        </>
                      ) : (
                        <>
                          {postData.linkedin}
                          {linkedInExpanded && postData.linkedin.length > 260 && (
                            <button 
                              type="button"
                              onClick={() => setLinkedInExpanded(false)}
                              className="text-[#0a66c2] hover:underline font-bold ml-1 cursor-pointer"
                            >
                              Réduire
                            </button>
                          )}
                        </>
                      )}
                    </div>

                    {/* Mock Attached Banner Graphic Preview */}
                    <div className="mt-4 border border-[#dfdfdf] rounded-lg overflow-hidden bg-slate-50">
                      <div className="h-36 sm:h-44 bg-gradient-to-br from-cyan-900 via-slate-900 to-black p-6 flex flex-col justify-between text-white relative">
                        <div className="h-10 w-10 border border-cyan-400/20 bg-cyan-950/40 rounded-lg flex items-center justify-center">
                          <Sparkles className="h-5 w-5 text-cyan-400" />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-widest font-bold">LIVRABLE EXCLUSIF</span>
                          <h5 className="font-extrabold tracking-tight text-white leading-tight text-sm uppercase max-w-sm truncate">{topic || "ADN DE MARQUE"}</h5>
                        </div>
                        <div className="absolute right-3 bottom-3 opacity-15">
                          <Linkedin className="h-16 w-16" />
                        </div>
                      </div>
                      <div className="p-3 border-t border-[#dfdfdf] bg-[#f8f9fa] flex items-center justify-between">
                        <div>
                          <p className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider leading-none">handcode.io</p>
                          <h4 className="font-bold text-xs text-slate-800 mt-1 truncate">Prendre les devants de l'intelligence artificielle</h4>
                        </div>
                        <button type="button" className="px-3 py-1.5 border border-[#0a66c2] hover:bg-[#ebf4fc] text-[#0a66c2] rounded-full text-xs font-bold leading-none">
                          S'inscrire
                        </button>
                      </div>
                    </div>

                    {/* Reactions Counter Row */}
                    <div className="mt-3 py-1.5 border-b border-[#ececec] flex justify-between items-center text-[11px] text-slate-500">
                      <div className="flex items-center gap-1">
                        <span className="bg-[#0a66c2] p-1 rounded-full text-white inline-flex text-[7px] font-bold">👍</span>
                        <span className="bg-cyan-500 p-1 rounded-full text-white inline-flex text-[7px] font-bold">💡</span>
                        <span className="hover:text-[#0a66c2] ml-1 cursor-pointer font-medium">{linkedinLiked ? 143 : 142} réactions</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="hover:underline cursor-pointer">11 commentaires</span>
                        <span>•</span>
                        <span className="hover:underline cursor-pointer">4 partages</span>
                      </div>
                    </div>

                    {/* Action buttons with active state */}
                    <div className="mt-1 flex justify-between items-center text-slate-600 text-xs font-semibold select-none">
                      <button 
                        type="button"
                        onClick={() => setLinkedinLiked(!linkedinLiked)}
                        className={`flex-1 hover:bg-slate-100 py-2.5 rounded flex items-center justify-center gap-2 cursor-pointer transition-colors ${linkedinLiked ? "text-[#0a66c2]" : ""}`}
                      >
                        <ThumbsUp className={`h-4.5 w-4.5 ${linkedinLiked ? "fill-[#0a66c2]" : ""}`} />
                        <span>Aimer</span>
                      </button>
                      <button type="button" className="flex-1 hover:bg-slate-100 py-2.5 rounded flex items-center justify-center gap-2 cursor-pointer transition-colors">
                        <MessageSquare className="h-4.5 w-4.5" />
                        <span>Commenter</span>
                      </button>
                      <button type="button" className="flex-1 hover:bg-slate-100 py-2.5 rounded flex items-center justify-center gap-2 cursor-pointer transition-colors">
                        <Share2 className="h-4.5 w-4.5" />
                        <span>Partager</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 font-sans text-xs text-slate-300 whitespace-pre-line leading-relaxed selection:bg-cyan-550/30">
                    {postData.linkedin}
                  </div>
                )}
              </div>

              {/* Twitter Post Card */}
              <div className="bg-[#0c0c0c] border border-white/5 rounded-xl overflow-hidden shadow-md">
                <div className="border-b border-white/5 p-4 flex justify-between items-center bg-black/40">
                  <span className="flex items-center gap-2 text-xs font-semibold text-cyan-400 font-mono">
                    <Twitter className="h-4.5 w-4.5 fill-cyan-400 text-cyan-400" />
                    TWITTER / X FEED
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowTwitterMockup(!showTwitterMockup)}
                      className={`text-[10px] uppercase font-mono px-3 py-1.5 rounded-md border transition-all cursor-pointer ${
                        showTwitterMockup 
                          ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-400 font-bold"
                          : "bg-black border-white/5 text-slate-400 hover:text-white"
                      }`}
                    >
                      {showTwitterMockup ? "Voir Brut 📄" : "Simuler Affichage 📱"}
                    </button>
                    <button
                      type="button"
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
                </div>

                {showTwitterMockup ? (
                  /* HIGH FIDELITY TWITTER DARK MODE SIMULATION */
                  <div className="p-5 bg-black text-slate-100 font-sans border-t border-white/5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex gap-3">
                        {/* Twitter avatar ring */}
                        <div className="h-10 w-10 rounded-full bg-cyan-950 border border-cyan-500/40 flex items-center justify-center font-bold text-cyan-400 shrink-0">
                          X
                        </div>
                        <div>
                          <div className="flex items-center gap-1">
                            <h4 className="font-bold text-[14px] hover:underline cursor-pointer text-white">
                              {brandIdentity?.brandPreset === "tech" ? "TechArtisan" : "ArtisanLabs"}
                            </h4>
                            <span className="h-3.5 w-3.5 bg-cyan-500 rounded-full flex items-center justify-center text-black font-extrabold text-[8px]" title="Vérifié">✓</span>
                            <span className="text-[13px] text-slate-500 font-normal">@digital_artisan • 2h</span>
                          </div>
                          <p className="mt-1.5 text-[13.5px] text-slate-200 leading-normal whitespace-pre-line font-normal break-words">
                            {postData.twitter}
                          </p>
                        </div>
                      </div>
                      <button type="button" className="text-slate-500 hover:text-white shrink-0">
                        <MoreHorizontal className="h-4.5 w-4.5" />
                      </button>
                    </div>

                    {/* Stats bar */}
                    <div className="mt-4 pt-3 border-t border-white/5 flex gap-5 text-[12px] font-mono text-slate-500 select-none">
                      <span className="text-slate-300 hover:underline cursor-pointer"><strong className="text-white">14.1K</strong> Vues</span>
                      <span className="text-slate-300 hover:underline cursor-pointer"><strong className="text-white">92</strong> Reposts</span>
                      <span className="text-slate-300 hover:underline cursor-pointer"><strong className="text-white">{twitterLiked ? 299 : 298}</strong> J'aime</span>
                    </div>

                    {/* Feedback interactions buttons */}
                    <div className="mt-3.5 pt-2 border-t border-white/5 flex justify-between px-2 text-slate-500">
                      <button type="button" className="hover:text-cyan-400 flex items-center gap-1.5 cursor-pointer">
                        <MessageSquare className="h-4 w-4" />
                        <span className="text-[10px] font-mono">14</span>
                      </button>
                      <button type="button" className="hover:text-green-400 flex items-center gap-1.5 cursor-pointer">
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-mono">92</span>
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setTwitterLiked(!twitterLiked)}
                        className={`hover:text-rose-500 flex items-center gap-1.5 cursor-pointer ${twitterLiked ? "text-rose-500" : ""}`}
                      >
                        <Heart className={`h-4 w-4 ${twitterLiked ? "fill-rose-500" : ""}`} />
                        <span className="text-[10px] font-mono">{twitterLiked ? 299 : 298}</span>
                      </button>
                      <button type="button" className="hover:text-[#000000] hover:bg-white flex items-center gap-1 cursor-pointer">
                        <Share2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 font-sans text-xs text-slate-300 whitespace-pre-line leading-relaxed selection:bg-cyan-550/30">
                    {postData.twitter}
                  </div>
                )}
              </div>

              {/* Instagram Post Card */}
              <div className="bg-[#0c0c0c] border border-white/5 rounded-xl overflow-hidden shadow-md">
                <div className="border-b border-white/5 p-4 flex justify-between items-center bg-black/40">
                  <span className="flex items-center gap-2 text-xs font-semibold text-cyan-400 font-mono">
                    <Instagram className="h-4.5 w-4.5" />
                    INSTAGRAM CONCEPT
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowInstagramMockup(!showInstagramMockup)}
                      className={`text-[10px] uppercase font-mono px-3 py-1.5 rounded-md border transition-all cursor-pointer ${
                        showInstagramMockup 
                          ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-400 font-bold"
                          : "bg-black border-white/5 text-slate-400 hover:text-white"
                      }`}
                    >
                      {showInstagramMockup ? "Voir Brut 📄" : "Simuler Affichage 📱"}
                    </button>
                    <button
                      type="button"
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
                </div>

                {showInstagramMockup ? (
                  /* HIGH FIDELITY INSTAGRAM FEED CARD SIMULATION */
                  <div className="bg-[#0a0a0c] border-t border-white/5 font-sans text-slate-200">
                    {/* Header bar */}
                    <div className="p-3 flex items-center justify-between border-b border-white/5 bg-black/50">
                      <div className="flex items-center gap-2.5">
                        <div className="p-[1.5px] rounded-full bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]">
                          <div className="h-8 w-8 rounded-full bg-black border border-black flex items-center justify-center font-display font-extrabold text-[10px] text-white">
                            {brandIdentity?.brandPreset ? brandIdentity?.brandPreset.substring(0, 1).toUpperCase() : "H"}
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-1 leading-none">
                            <span className="font-bold text-xs hover:underline cursor-pointer text-white">digital.artisan.studio</span>
                            <span className="h-3.5 w-3.5 bg-blue-500 rounded-full flex items-center justify-center text-white font-extrabold text-[7px]" title="Compte officiel">✔</span>
                          </div>
                          <span className="text-[9px] text-slate-550 font-mono scale-90 block mt-0.5" style={{ transformOrigin: "left" }}>HandCode Digital HQ</span>
                        </div>
                      </div>
                      <button type="button" className="text-slate-400 hover:text-white">
                        <MoreHorizontal className="h-5 w-5" />
                      </button>
                    </div>

                    {/* Instagram Image Canvas mockup */}
                    <div className="aspect-square w-full bg-gradient-to-tr from-cyan-900 via-emerald-950 to-slate-900 flex flex-col justify-between p-8 relative overflow-hidden select-none">
                      <div className="flex justify-between items-start">
                        <div className="px-3 py-1 bg-white/10 hover:bg-white/15 border border-white/10 rounded-full font-mono text-[8px] font-bold text-cyan-300 uppercase tracking-wider backdrop-blur">
                          ⚡ CRAFTED BRANDING
                        </div>
                        <Instagram className="h-6 w-6 text-white/15" />
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-xs font-mono text-cyan-300 uppercase tracking-widest font-extrabold">STUDIO DESIGN ENGINE</h4>
                        <p className="text-2xl font-light font-display text-white tracking-tight leading-tight uppercase">
                          {topic ? topic.substring(0, 45) + "..." : "COHÉRENCE IA ULTIME"}
                        </p>
                      </div>

                      <div className="flex justify-between items-center text-[8px] font-mono text-slate-400">
                        <span>© HANDCODE AGENT</span>
                        <span>TARGET: {brandIdentity?.targetAudience ? brandIdentity.targetAudience.split(',')[0].toUpperCase() : "SOLOPRENEURS"}</span>
                      </div>
                      
                      <div className="absolute right-[-40px] bottom-[-40px] w-48 h-48 bg-cyan-400/5 rounded-full blur-2xl" />
                    </div>

                    {/* Feed interactions */}
                    <div className="p-3.5 space-y-2.5 bg-black/30">
                      <div className="flex justify-between items-center text-white select-none">
                        <div className="flex gap-4">
                          <button 
                            type="button" 
                            onClick={() => setInstagramLiked(!instagramLiked)}
                            className={`hover:text-rose-500 cursor-pointer ${instagramLiked ? "text-rose-500" : ""}`}
                          >
                            <Heart className={`h-5 w-5 ${instagramLiked ? "fill-rose-500" : ""}`} />
                          </button>
                          <button type="button" className="hover:text-cyan-400 cursor-pointer">
                            <MessageSquare className="h-5 w-5" />
                          </button>
                          <button type="button" className="hover:text-cyan-400 cursor-pointer">
                            <Send className="h-5 w-5" />
                          </button>
                        </div>
                        <button type="button" className="hover:text-cyan-400 cursor-pointer">
                          <Bookmark className="h-5 w-5" />
                        </button>
                      </div>

                      <div className="space-y-1 font-sans text-xs">
                        <p className="text-white font-bold leading-none">{instagramLiked ? "1 241 J'aime" : "1 240 J'aime"}</p>
                        <p className="text-slate-300 text-[12.5px] leading-relaxed break-words pt-1.5">
                          <span className="font-bold text-white mr-2">digital.artisan.studio</span>
                          {postData.instagram}
                        </p>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider block pt-1.5 leading-none">Il y a 2 heures</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 font-sans text-xs text-slate-300 whitespace-pre-line leading-relaxed selection:bg-cyan-550/30">
                    {postData.instagram}
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
