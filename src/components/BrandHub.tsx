import React, { useState } from "react";
import { 
  Sliders, 
  Check, 
  Settings, 
  ShieldCheck, 
  Sparkles, 
  HelpCircle, 
  Save, 
  Eye, 
  RefreshCw,
  Fingerprint,
  Info
} from "lucide-react";
import { BrandIdentity } from "../types";

interface BrandHubProps {
  brandIdentity: BrandIdentity;
  onSave: (brand: BrandIdentity) => void;
}

const PRESETS = [
  {
    name: "Tech Startup B2B",
    targetAudience: "Fondateurs de SaaS, décideurs tech & directeurs de l'innovation",
    editorialTone: "Sérieux, technique, ultra-professionnel avec une touche minimaliste moderne",
    primaryColor: "#06b6d4", // Cyan
    secondaryColor: "#3b82f6", // Blue
    keywords: "intelligence artificielle, no-code, scalabilité, automatisation, productivité B2B"
  },
  {
    name: "Artisan Solopreneur / Minimaliste",
    targetAudience: "Créatifs solos, freelances experts & artisans du numérique",
    editorialTone: "Bespoke, authentique, humble, direct et orienté vers l'artisanat du code",
    primaryColor: "#10b981", // Emerald
    secondaryColor: "#14b8a6", // Teal
    keywords: "artisanat digital, codes propres, éthique, efficacité solo, design épuré"
  },
  {
    name: "Agence Créative / Premium Storyteller",
    targetAudience: "Marques de luxe, marques haut de gamme, startups esthétiques & agences marketing",
    editorialTone: "Créatif, élégant, storyteller premium, audacieux, hautement inspirant",
    primaryColor: "#ec4899", // Pink
    secondaryColor: "#a855f7", // Purple
    keywords: "émotion, identité d'exception, design disruptif, narration, expérience utilisateur"
  },
  {
    name: "Coach / Formateur / Éducateur",
    targetAudience: "Professionnels en reconversion, étudiants, apprenants & auditeurs de web-formations",
    editorialTone: "Chaleureux, pédagogue, extrêmement engageant, accessible, plein d'énergie positive",
    primaryColor: "#f59e0b", // Amber
    secondaryColor: "#ef4444", // Red
    keywords: "accompagnement, croissance personnelle, mentorat, compétences, passage à l'action"
  }
];

export default function BrandHub({ brandIdentity, onSave }: BrandHubProps) {
  const [targetAudience, setTargetAudience] = useState(brandIdentity.targetAudience);
  const [editorialTone, setEditorialTone] = useState(brandIdentity.editorialTone);
  const [primaryColor, setPrimaryColor] = useState(brandIdentity.primaryColor);
  const [secondaryColor, setSecondaryColor] = useState(brandIdentity.secondaryColor);
  const [keywords, setKeywords] = useState(brandIdentity.keywords);
  const [isActive, setIsActive] = useState(brandIdentity.isActive);

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Apply a preset configuration
  const handleApplyPreset = (preset: typeof PRESETS[0]) => {
    setTargetAudience(preset.targetAudience);
    setEditorialTone(preset.editorialTone);
    setPrimaryColor(preset.primaryColor);
    setSecondaryColor(preset.secondaryColor);
    setKeywords(preset.keywords);
    
    // Auto-save preset applied
    const updated: BrandIdentity = {
      isActive: true, // Auto activate on applying preset to ease UX
      targetAudience: preset.targetAudience,
      editorialTone: preset.editorialTone,
      primaryColor: preset.primaryColor,
      secondaryColor: preset.secondaryColor,
      keywords: preset.keywords
    };
    setIsActive(true);
    onSave(updated);
    triggerSuccessAnimation();
  };

  const handleManualSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: BrandIdentity = {
      isActive,
      targetAudience,
      editorialTone,
      primaryColor,
      secondaryColor,
      keywords
    };
    onSave(updated);
    triggerSuccessAnimation();
  };

  const triggerSuccessAnimation = () => {
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
    }, 2500);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Intro block */}
      <div className="space-y-2">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
            <Fingerprint className="h-4 w-4 text-white" />
          </div>
          <h2 className="text-xl font-medium tracking-tight text-white font-display uppercase">Brand Identity Hub</h2>
        </div>
        <p className="text-slate-400 text-xs leading-relaxed max-w-2xl">
          Définissez l'ADN de votre entreprise (cible, ton éditorial signature, charte graphique de marque et mots-clés) une fois pour toutes. Une fois activé, l'IA et tous les générateurs du cockpit héritent automatiquement de ces valeurs stratégiques.
        </p>
      </div>

      {/* Global Toggle Activation Option Box */}
      <div className={`p-5 rounded-2xl border transition-all duration-300 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
        isActive 
          ? "bg-cyan-950/20 border-cyan-500/30 shadow-[0_0_20px_rgba(34,211,238,0.04)]" 
          : "bg-black/40 border-white/5"
      }`}>
        <div className="space-y-1 max-w-xl">
          <label className="text-sm font-semibold text-white flex items-center gap-2 cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={isActive}
              onChange={(e) => {
                const checked = e.target.checked;
                setIsActive(checked);
                onSave({
                  isActive: checked,
                  targetAudience,
                  editorialTone,
                  primaryColor,
                  secondaryColor,
                  keywords
                });
                triggerSuccessAnimation();
              }}
              className="accent-cyan-400 h-4.5 w-4.5 rounded border-white/10 bg-black cursor-pointer"
            />
            <span className="flex items-center gap-1.5">
              🚀 Alignement de Marque IA Activé 
              {isActive && <span className="text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-800 px-1.5 py-0.5 rounded font-mono font-bold uppercase leading-none scale-90">Synchronisé</span>}
            </span>
          </label>
          <p className="text-slate-500 text-[11px] leading-relaxed pl-6.5">
            Lorsque cette option est activée, vos générateurs de posts, d'UX Copywriting/SEO, de design et de tunnels dynamiques ManyChat adaptent instantanément leurs calculs et prompts IA sur votre charte unifiée.
          </p>
        </div>
        <div className="pl-6.5 md:pl-0 shrink-0">
          <span className={`text-[10px] uppercase font-mono px-3 py-1.5 rounded-full font-bold border ${
            isActive 
              ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400" 
              : "bg-white/5 border-transparent text-slate-500"
          }`}>
            {isActive ? "Statut : Actif Universel" : "Statut : Inactif (Mode Manuel)"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Editor Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleManualSave} className="bg-gradient-to-b from-[#09090c] to-[#030303] border border-white/5 rounded-2xl p-6 space-y-5">
            <h3 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-widest pb-3 border-b border-white/5 flex items-center gap-1.5">
              <Sliders className="h-4 w-4 text-cyan-400" />
              Éditer l'ADN de Marque
            </h3>

            {/* Target Audience Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold font-mono text-slate-300 uppercase tracking-wide flex items-center justify-between">
                <span>Cible Marketing (Persona type) :</span>
                <span className="text-[10px] text-slate-500 font-normal">Sera intégré au prd/copywriting/posts</span>
              </label>
              <textarea
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                rows={2}
                placeholder="Ex: Startups de l'immobilier, porteurs de projet SaaS B2C, commerces locaux..."
                className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all font-sans leading-relaxed"
                required
              />
            </div>

            {/* Editorial Tone signature */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold font-mono text-slate-300 uppercase tracking-wide flex items-center justify-between">
                <span>Ton Éditorial Signature :</span>
                <span className="text-[10px] text-slate-500 font-normal">Contrôle la tonalité d'écriture IA</span>
              </label>
              <input
                type="text"
                value={editorialTone}
                onChange={(e) => setEditorialTone(e.target.value)}
                placeholder="Ex: Direct, créatif, formateur hautement technique avec rigueur..."
                className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all"
                required
              />
            </div>

            {/* Keywords Separation with commas */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold font-mono text-slate-300 uppercase tracking-wide flex items-center justify-between">
                <span>Mots-clés Métier (Séparés par des virgules) :</span>
                <span className="text-[10px] text-slate-500 font-normal">Injection contextuelle</span>
              </label>
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="Ex: intelligence artificielle, web design, no-code, automatisme"
                className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all font-mono"
                required
              />
            </div>

            {/* Primary & Secondary Hex brand colors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Primary color selection */}
              <div className="space-y-1.5 bg-black/30 border border-white/5 p-3 rounded-xl">
                <label className="text-xs font-bold font-mono text-slate-300 uppercase tracking-wide block">
                  Couleur Primaire Hex :
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-8 h-8 rounded border border-white/10 bg-transparent cursor-pointer p-0"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    placeholder="#000000"
                    className="flex-1 bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono uppercase focus:outline-none transition-all focus:border-cyan-500/50"
                  />
                </div>
              </div>

              {/* Secondary color selection */}
              <div className="space-y-1.5 bg-black/30 border border-white/5 p-3 rounded-xl">
                <label className="text-xs font-bold font-mono text-slate-300 uppercase tracking-wide block">
                  Couleur Secondaire Hex :
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-8 h-8 rounded border border-white/10 bg-transparent cursor-pointer p-0"
                  />
                  <input
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    placeholder="#000000"
                    className="flex-1 bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono uppercase focus:outline-none transition-all focus:border-cyan-500/50"
                  />
                </div>
              </div>
            </div>

            {/* Submit Action Block */}
            <div className="border-t border-white/5 pt-4 flex justify-between items-center bg-black/20 -mx-6 -mb-6 p-6 rounded-b-2xl">
              <span className="text-[10px] text-slate-500 font-mono">
                Dernière synchro locale : instantanée
              </span>
              <button
                type="submit"
                className="flex items-center justify-center gap-2 py-2.5 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-semibold text-xs cursor-pointer transition-all active:scale-95 shadow-[0_0_15px_rgba(34,211,238,0.25)] hover:shadow-[0_0_20px_rgba(34,211,238,0.4)]"
              >
                <Save className="h-4 w-4" />
                {savedSuccess ? "Modifications Enregistrées ✔" : "Sauvegarder l'Identité"}
              </button>
            </div>
          </form>

          {/* Quick Informational Notice block */}
          <div className="bg-[#030303] border border-white/5 rounded-2xl p-5 flex items-start gap-3.5">
            <Info className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Comment ça fonctionne au cœur des générateurs ?</h4>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Lorsque vous activez le <span className="text-cyan-400 font-semibold font-sans">Brand Identity Hub</span>, l'IA reçoit de manière prioritaire votre cahier des charges de marque. Par exemple, le générateur de posts réseaux ne vous demandera pas quel ton choisir : il adaptera instantanément son écriture pour cibler votre audience spécifiée en utilisant vos teintes primaires/secondaires dans d'éventuels designs générés.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Presets Config & Brand DNA Card readout */}
        <div className="space-y-6">
          
          {/* Presets List */}
          <div className="bg-[#09090c] border border-white/5 rounded-2xl p-5 space-y-3.5">
            <h3 className="text-xs font-bold font-mono text-slate-300 uppercase tracking-widest pb-2.5 border-b border-white/5 flex items-center justify-between">
              <span>⚡ Profils d'Exemple</span>
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            </h3>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Sélectionnez un profil pré-paramétré pour l'adopter immédiatement comme base de travail personnalisée.
            </p>
            <div className="space-y-2">
              {PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className="w-full text-left p-3 rounded-xl bg-black/40 border border-white/5 hover:border-cyan-500/25 transition-all group flex items-center justify-between cursor-pointer active:scale-[0.98]"
                >
                  <div className="min-w-0 pr-3">
                    <span className="block text-xs font-bold text-white group-hover:text-cyan-400 transition-colors">{p.name}</span>
                    <span className="block text-[10px] text-slate-500 font-sans truncate mt-0.5">{p.editorialTone}</span>
                  </div>
                  <Check className="h-3.5 w-3.5 text-cyan-400/0 group-hover:text-cyan-400 transition-all shrink-0 ml-1" />
                </button>
              ))}
            </div>
          </div>

          {/* Hologram / Blueprint Display Card */}
          <div className="bg-gradient-to-b from-[#09090c]/70 to-black border border-white/10 rounded-2xl p-5 relative overflow-hidden select-none font-mono text-xs">
            {/* Grid background logic */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
            
            <div className="relative space-y-4">
              <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
                <span className="text-[10px] font-bold text-cyan-400 tracking-widest uppercase">BRAND_GEN_DNA // BLUEPRINT</span>
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping"></span>
              </div>

              {/* Display colors Swatches */}
              <div className="space-y-1.5">
                <span className="text-[9px] text-slate-500 block">COLO_SCHEME //</span>
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center gap-1.5 bg-black/30 p-1.5 rounded-lg border border-white/5">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: primaryColor || "#000000" }} />
                    <span className="text-[9px]" style={{ color: primaryColor }}>Primary</span>
                  </div>
                  <div className="flex-1 flex items-center gap-1.5 bg-black/30 p-1.5 rounded-lg border border-white/5">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: secondaryColor || "#000000" }} />
                    <span className="text-[9px]" style={{ color: secondaryColor }}>Secondary</span>
                  </div>
                </div>
              </div>

              {/* Condensed readout of current variables */}
              <div className="space-y-3 pt-2 text-[10px]">
                <div className="space-y-0.5 bg-black/40 border border-white/5 p-2 rounded-lg">
                  <span className="text-[8px] text-slate-500 font-bold uppercase block">TARGET_PERSONA :</span>
                  <p className="text-white text-xs truncate leading-relaxed">{targetAudience || "(Vide)"}</p>
                </div>

                <div className="space-y-0.5 bg-black/40 border border-white/5 p-2 rounded-lg">
                  <span className="text-[8px] text-slate-500 font-bold uppercase block">EDITORIAL_TONE :</span>
                  <p className="text-cyan-400 text-xs truncate leading-relaxed">{editorialTone || "(Vide)"}</p>
                </div>

                <div className="space-y-0.5 bg-black/40 border border-white/5 p-2 rounded-lg">
                  <span className="text-[8px] text-slate-500 font-bold uppercase block">BRAND_KEYWORDS :</span>
                  <p className="text-slate-300 font-mono truncate text-[9px]">{keywords || "(Vide)"}</p>
                </div>
              </div>

              {/* Decorative watermark */}
              <div className="pt-3 border-t border-white/5 text-[9px] flex justify-between text-slate-600 font-mono">
                <span>OS_SYNCHRONIZED: YES</span>
                <span>UUID_REF: 0x90EA3A</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
