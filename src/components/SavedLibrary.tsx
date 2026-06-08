import React, { useState } from "react";
import { Search, FolderOpen, Heart, Trash2, Calendar, Clipboard, Check, Eye, ExternalLink, Sparkles, BookOpen, FileText, Code, Palette, HelpCircle, Download } from "lucide-react";
import { SavedItem, ModuleType } from "../types";

interface SavedLibraryProps {
  items: SavedItem[];
  onDelete: (id: string) => void;
  onNavigateToTab: (tab: ModuleType) => void;
}

export default function SavedLibrary({ items, onDelete, onNavigateToTab }: SavedLibraryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<'all' | ModuleType>('all');
  const [viewingItem, setViewingItem] = useState<SavedItem | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const filterTabs = [
    { id: 'all', label: 'Tous', icon: FolderOpen },
    { id: 'social', label: 'Réseaux', icon: FolderOpen },
    { id: 'code', label: 'Snippets', icon: Code },
    { id: 'copy', label: 'Copy & SEO', icon: FileText },
    { id: 'design', label: 'Design assets', icon: Palette },
    { id: 'manychat', label: 'Auto-Tunnels', icon: HelpCircle },
    { id: 'brief', label: 'Briefs & Devis', icon: BookOpen }
  ];

  const filteredItems = items.filter(item => {
    const matchesFilter = selectedFilter === 'all' || item.type === selectedFilter;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          JSON.stringify(item.data).toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getModuleColor = (type: ModuleType) => {
    switch (type) {
      case 'social': return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
      case 'code': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'copy': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'design': return 'text-pink-400 bg-pink-500/10 border-pink-500/20';
      case 'manychat': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'brief': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      default: return 'text-slate-400 bg-white/5 border-white/5';
    }
  };

  const getModuleLabel = (type: ModuleType) => {
    switch (type) {
      case 'social': return 'Social Post';
      case 'code': return 'Code Snippet';
      case 'copy': return 'Copywriting & SEO';
      case 'design': return 'Design Asset';
      case 'manychat': return 'Tunnel ManyChat';
      case 'brief': return 'Brief & Devis';
      default: return 'Asset';
    }
  };

  const copyText = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const downloadSavedSvg = (svgText: string, id: string) => {
    const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `artisan_saved_vector_${id}.svg`;
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
            <Heart className="h-6 w-6 text-pink-500 fill-pink-500/10" />
            BIBLIOTHÈQUE D'ARTISAN
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Recherche, consulte et réutilise toutes tes rédactions, snippets et nuanciers vectoriels sauvegardés.
          </p>
        </div>
      </div>

      {/* Main search and Filters and Split Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Items List */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-4">
            {/* Search Box */}
            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                className="w-full bg-black border border-white/5 hover:border-slate-800 focus:border-cyan-500/50 rounded-xl pl-10 pr-4 py-3 text-xs text-white focus:outline-none placeholder-slate-650 transition-colors font-mono"
                placeholder="Rechercher un snippet, un post, un mot-clé..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-1 p-1 bg-black rounded-lg border border-white/5">
              {filterTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedFilter(tab.id as any)}
                  className={`px-3 py-1.5 rounded-md text-[10px] uppercase font-mono tracking-wider transition-colors ${
                    selectedFilter === tab.id
                      ? "bg-cyan-500/10 border border-cyan-500/20 text-cyan-400"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* List Rows */}
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {filteredItems.length === 0 ? (
                <div className="border border-dashed border-white/5 rounded-xl p-8 text-center bg-transparent">
                  <FolderOpen className="h-8 w-8 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500 text-xs font-mono uppercase tracking-wider">Aucun élément trouvé</p>
                  <p className="text-slate-600 text-[11px] mt-1 font-mono">
                    {items.length === 0 ? "Génère des assets pour alimenter ta bibliothèque." : "Modifie tes critères de filtrage."}
                  </p>
                </div>
              ) : (
                filteredItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setViewingItem(item)}
                    className={`group w-full text-left p-4 rounded-xl border transition-all cursor-pointer flex justify-between items-center ${
                      viewingItem?.id === item.id
                        ? "bg-cyan-500/10 border-cyan-500/40"
                        : "bg-[#0c0c0c] border-white/5 hover:border-slate-800"
                    }`}
                  >
                    <div className="space-y-1.5 min-w-0 pr-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded-full border tracking-wide uppercase ${getModuleColor(item.type)}`}>
                          {getModuleLabel(item.type)}
                        </span>
                        <div className="flex items-center gap-1 text-slate-500 text-[10px] font-mono">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(item.createdAt).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>
                      <h4 className="text-white font-semibold text-xs truncate font-display group-hover:text-cyan-400 transition-colors">
                        {item.title}
                      </h4>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (viewingItem?.id === item.id) setViewingItem(null);
                        onDelete(item.id);
                      }}
                      className="text-slate-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-colors shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Detailed Item Preview Panel */}
        <div className="lg:col-span-7">
          {!viewingItem ? (
            <div className="bg-black/20 border-2 border-dashed border-white/5 rounded-xl p-12 text-center h-full flex flex-col justify-center items-center">
              <FolderOpen className="h-12 w-12 text-slate-700 mb-4 animate-pulse" />
              <h3 className="text-white font-medium text-xs font-mono uppercase tracking-widest">Aucun élément sélectionné</h3>
              <p className="text-slate-550 text-xs mt-1 max-w-sm mx-auto leading-relaxed">
                Cliquer sur un élément de la liste pour voir ses détails techniques, copier les textes, ou inspecter le code source.
              </p>
            </div>
          ) : (
            <div className="bg-[#0c0c0c] border border-white/5 rounded-xl p-6 shadow-md space-y-6">
              
              {/* Header Title with action buttons */}
              <div className="flex justify-between items-start border-b border-white/5 pb-5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-bold font-mono px-2.5 py-0.5 rounded-full border uppercase ${getModuleColor(viewingItem.type)}`}>
                      {getModuleLabel(viewingItem.type)}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">ID: {viewingItem.id}</span>
                  </div>
                  <h2 className="text-white font-bold text-sm tracking-wider uppercase font-display mt-2">{viewingItem.title}</h2>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      onNavigateToTab(viewingItem.type);
                    }}
                    className="flex items-center gap-1.5 bg-white/5 hover:bg-cyan-500/10 border border-white/5 hover:border-cyan-500/20 text-cyan-400 rounded-md px-3 py-1.5 text-xs font-mono transition-colors cursor-pointer"
                  >
                    Réutiliser
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Display Content dynamically based on Module Type */}
              <div className="space-y-4">
                
                {/* 1. SOCIAL POSTS CUSTOM VIEW */}
                {viewingItem.type === 'social' && (
                  <div className="space-y-5">
                    {/* LinkedIn */}
                    <div className="bg-black border border-white/5 rounded-xl p-4">
                      <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-3">
                        <span className="text-[10px] font-mono tracking-wider font-semibold text-[#0A66C2] uppercase">LinkedIn Post</span>
                        <button
                          onClick={() => copyText(viewingItem.data.linkedin, "library_linkedin")}
                          className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors font-mono"
                        >
                          {copiedField === "library_linkedin" ? "Copié !" : "Copier"}
                        </button>
                      </div>
                      <p className="text-xs text-slate-350 font-sans whitespace-pre-wrap leading-relaxed">{viewingItem.data.linkedin}</p>
                    </div>

                    {/* Twitter */}
                    <div className="bg-black border border-white/5 rounded-xl p-4">
                      <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-3">
                        <span className="text-[10px] font-mono tracking-wider font-semibold text-slate-300 uppercase">Twitter / X Post</span>
                        <button
                          onClick={() => copyText(viewingItem.data.twitter, "library_twitter")}
                          className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors font-mono"
                        >
                          {copiedField === "library_twitter" ? "Copié !" : "Copier"}
                        </button>
                      </div>
                      <p className="text-xs text-slate-350 font-sans whitespace-pre-wrap leading-relaxed">{viewingItem.data.twitter}</p>
                    </div>

                    {/* Instagram */}
                    <div className="bg-black border border-white/5 rounded-xl p-4">
                      <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-3">
                        <span className="text-[10px] font-mono tracking-wider font-semibold text-[#E1306C] uppercase">Instagram Caption</span>
                        <button
                          onClick={() => copyText(viewingItem.data.instagram, "library_instagram")}
                          className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors font-mono"
                        >
                          {copiedField === "library_instagram" ? "Copié !" : "Copier"}
                        </button>
                      </div>
                      <p className="text-xs text-slate-350 font-sans whitespace-pre-wrap leading-relaxed">{viewingItem.data.instagram}</p>
                    </div>
                  </div>
                )}

                {/* 2. CODE SNIPPET SPECIALIZED VIEW */}
                {viewingItem.type === 'code' && (
                  <div className="space-y-4">
                    <div className="bg-black rounded-xl border border-white/5 overflow-hidden font-mono text-xs">
                      <div className="bg-black/45 border-b border-white/5 px-4 py-2.5 flex justify-between items-center">
                        <span className="text-slate-400 font-bold">{viewingItem.data.language}</span>
                        <button
                          onClick={() => copyText(viewingItem.data.code, "library_code")}
                          className="text-cyan-400 hover:text-cyan-350 font-bold font-mono"
                        >
                          {copiedField === "library_code" ? "Copié !" : "Copier"}
                        </button>
                      </div>
                      <pre className="p-4 overflow-auto text-cyan-200 max-h-[350px] whitespace-pre-wrap">
                        <code>{viewingItem.data.code}</code>
                      </pre>
                    </div>

                    <div className="p-4 bg-black border border-white/5 rounded-xl space-y-2">
                      <h4 className="text-white font-bold text-xs uppercase tracking-wider font-mono">Notice Technique</h4>
                      <p className="text-slate-400 text-xs leading-relaxed whitespace-pre-line font-mono">{viewingItem.data.explanation}</p>
                    </div>
                  </div>
                )}

                {/* 3. COPYWRITING AND SEO STRATEGY VIEW */}
                {viewingItem.type === 'copy' && (
                  <div className="space-y-4">
                    {/* Hero section */}
                    <div className="bg-black border border-white/5 rounded-xl p-4 space-y-2">
                      <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-1">
                        <span className="text-[10px] text-cyan-400 font-mono uppercase font-bold">Hero Copy</span>
                        <button
                          onClick={() => copyText(`Titre: ${viewingItem.data.hero.title}\nDescription: ${viewingItem.data.hero.content}`, "lib_copy_hero")}
                          className="text-xs text-cyan-400 hover:text-cyan-350 font-mono"
                        >
                          {copiedField === "lib_copy_hero" ? "Copié !" : "Copier"}
                        </button>
                      </div>
                      <h4 className="text-white font-bold leading-tight text-xs font-mono uppercase">{viewingItem.data.hero.title}</h4>
                      <p className="text-slate-300 text-xs leading-relaxed">{viewingItem.data.hero.content}</p>
                      <p className="text-[9px] text-slate-500 font-mono">CTA: {viewingItem.data.hero.ctaText}</p>
                    </div>

                    {/* SEO Block */}
                    <div className="bg-black border border-white/5 rounded-xl p-4 space-y-2 font-mono text-xs">
                      <span className="text-[10px] text-emerald-400 font-mono uppercase font-bold block border-b border-white/5 pb-2">Metas Référencement</span>
                      <div className="space-y-2">
                        <div>
                          <span className="text-[9px] text-slate-500 uppercase block font-bold">Title</span>
                          <span className="text-white font-semibold">{viewingItem.data.seoTitle}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 uppercase block font-bold">Description</span>
                          <span className="text-slate-300 leading-relaxed">{viewingItem.data.seoDescription}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. DESIGN ASSETS VISUALIZER VIEW */}
                {viewingItem.type === 'design' && (
                  <div className="space-y-5">
                    {/* Palette Swatches */}
                    <div className="bg-black p-4 border border-white/5 rounded-xl">
                      <span className="text-[9px] text-slate-500 font-mono font-bold uppercase block mb-3">Palette & Contraste</span>
                      <div className="grid grid-cols-5 gap-2">
                        {viewingItem.data.palette.map((color: any, idx: number) => (
                          <div 
                            key={idx} 
                            onClick={() => copyText(color.hex, `palette_lib_${idx}`)}
                            className="text-center group cursor-pointer relative font-mono"
                          >
                            <div className="h-10 w-full rounded-md shadow" style={{ backgroundColor: color.hex }} />
                            <span className="text-[9px] font-bold block truncate text-slate-500 uppercase mt-1">{color.role}</span>
                            <span className="text-[10px] text-slate-300 mt-0.5">{color.hex}</span>
                            {copiedField === `palette_lib_${idx}` && (
                              <div className="absolute inset-0 bg-black border border-emerald-800/10 rounded-md flex items-center justify-center text-[10px] text-emerald-400 font-bold">Copié</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Vector Icon */}
                    {viewingItem.data.svgIcon && (
                      <div className="bg-black border border-white/5 rounded-xl p-6 flex flex-col items-center relative">
                        <div className="flex justify-between items-center w-full border-b border-white/5 pb-3 mb-4">
                          <span className="text-xs text-slate-550 font-mono uppercase tracking-wider">Élément Vectoriel Rendu ({viewingItem.data.style})</span>
                          <button
                            onClick={() => downloadSavedSvg(viewingItem.data.svgIcon, viewingItem.id)}
                            className="text-xs text-cyan-400 hover:text-cyan-350 flex items-center gap-1.5 font-mono"
                          >
                            <Download className="h-3.5 w-3.5" />
                            Télécharger
                          </button>
                        </div>
                        <div 
                          className="w-[180px] h-[180px] drop-shadow-[0_0_20px_rgba(34,211,238,0.2)] bg-black/40 border border-white/5 p-4 rounded-xl flex items-center justify-center"
                          dangerouslySetInnerHTML={{ __html: viewingItem.data.svgIcon }}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* 5. MANYCHAT CONFIG CUSTOM VIEWS */}
                {viewingItem.type === 'manychat' && (
                  <div className="space-y-4 font-mono text-xs text-slate-350">
                    <div className="bg-black border border-white/5 rounded-xl p-4 space-y-3">
                      <span className="text-[10px] text-amber-400 uppercase font-bold block border-b border-white/5 pb-2">Comportement du Tunnel</span>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-[10px] text-slate-500 block">Persona</span>
                          <span className="text-white font-medium">{viewingItem.data.persona}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Mots-clés Déclencheurs</span>
                          <span className="text-cyan-400 font-medium font-mono">{viewingItem.data.keywords}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block mt-2">Objectif principal</span>
                        <span className="text-white leading-relaxed">{viewingItem.data.objective}</span>
                      </div>
                    </div>

                    <div className="bg-black border border-white/5 rounded-xl p-4 space-y-3">
                      <span className="text-[10px] text-amber-400 uppercase font-bold block border-b border-white/5 pb-2">Bouton de Redirection (CTA)</span>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-[10px] text-slate-500 block">Texte Bouton (Caption)</span>
                          <span className="text-white font-medium">{viewingItem.data.ctaText}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Collecte d'e-mail ?</span>
                          <span className="text-white">{viewingItem.data.addLeadCapture ? "Oui, active" : "Non"}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block mt-2">Adresse URL absolue (Redirection)</span>
                        <div className="flex justify-between items-center bg-[#070708] border border-white/5 p-2 rounded mt-1 overflow-hidden select-all text-cyan-200">
                          <span className="truncate">{viewingItem.data.ctaUrl}</span>
                          <a href={viewingItem.data.ctaUrl} target="_blank" rel="noreferrer" className="text-cyan-400 ml-2 hover:underline shrink-0 font-bold">Ouvrir</a>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-amber-950/10 border border-amber-900/10 rounded-xl space-y-1">
                      <h4 className="text-amber-400 font-bold text-xs uppercase tracking-wider">Liaison Webhook ManyChat</h4>
                      <p className="text-slate-400 text-[11px] leading-relaxed font-sans">
                        Transmets ce paramétrage au bloc "External Request" de ManyChat. Tu peux retrouver tous les paramètres et tester le comportement en temps réel sous l'onglet "Auto-Tunnels IA" du menu principal.
                      </p>
                    </div>
                  </div>
                )}

                {/* 6. BRIEF CADRAGE AND INTERACTIVE DEVIS VIEW */}
                {viewingItem.type === 'brief' && (
                  <div className="space-y-5">
                    <div className="bg-black border border-white/5 rounded-xl p-4 space-y-2">
                      <span className="text-[10px] text-cyan-400 font-mono uppercase font-bold block border-b border-white/5 pb-2">Résumé Exécutif du PRD</span>
                      <p className="text-xs text-slate-350 leading-relaxed whitespace-pre-wrap font-sans">{viewingItem.data.prd.summary}</p>
                    </div>

                    <div className="p-4 bg-black border border-white/5 rounded-xl space-y-3 font-mono text-xs">
                      <span className="text-[10px] text-cyan-400 font-mono uppercase font-bold block border-b border-white/5 pb-2">Devis Dynamique Sauvegardé</span>
                      <div className="space-y-1.5 mt-2">
                        {viewingItem.data.quote.items.map((it: any, idx: number) => (
                          <div key={idx} className="flex justify-between border-b border-white/5 pb-1 text-[11px]">
                            <span className="text-slate-400">{it.description} ({it.hours}h × {it.rate}€)</span>
                            <span className="text-white font-bold">{it.hours * it.rate}€ HT</span>
                          </div>
                        ))}
                        <div className="flex justify-between pt-3 text-cyan-400 font-extrabold text-xs uppercase border-t border-cyan-500/20">
                          <span>Total Estimé TTC (TVA 20%)</span>
                          <span>{viewingItem.data.calculatedTotals ? viewingItem.data.calculatedTotals.totalTTC : Math.round(viewingItem.data.quote.items.reduce((acc: number, cur: any) => acc + (cur.hours * cur.rate), 0) * 1.2)}€ TTC</span>
                        </div>
                      </div>
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
