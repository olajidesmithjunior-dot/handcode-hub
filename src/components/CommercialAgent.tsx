import React, { useState } from "react";
import { 
  Bot, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Clock, 
  Euro, 
  Briefcase, 
  Slack, 
  Mail, 
  Check, 
  Copy, 
  Plus, 
  ChevronRight, 
  Fingerprint, 
  AlertTriangle, 
  TrendingUp, 
  Coins,
  Send,
  User,
  Zap
} from "lucide-react";

interface CommercialAgentProps {
  onSaveBrief: (type: "brief", title: string, data: any) => void;
  onNavigateToTab: (tab: any) => void;
}

interface ProspectForm {
  name: string;
  company: string;
  problem: string;
  budgetFCFA: number;
  timelineWeeks: number;
}

export default function CommercialAgent({ onSaveBrief, onNavigateToTab }: CommercialAgentProps) {
  // Preset prospects list
  const presets = [
    {
      name: "Jean-Luc K.",
      company: "Abidjan Resto-Livr",
      problem: "Nous perdons trop de temps avec nos commandes qui arrivent par WhatsApp et téléphone. Les erreurs sont fréquentes dans les adresses et le suivi des livreurs. Je veux un système qui centralise les commandes et notifie automatiquement nos livreurs.",
      budgetFCFA: 800000,
      timelineWeeks: 3,
      label: "Jean-Luc K. (Resto-Livr) — 800 000 FCFA"
    },
    {
      name: "Marie-Noëlle A.",
      company: "Kira Cosmetics Int.",
      problem: "Nous cherchons à synchroniser notre inventaire de produits de beauté en temps réel sur 4 points de vente physiques à Lomé et notre boutique e-commerce. Nous voulons aussi un assistant IA WhatsApp automatisé pour répondre aux commandes et actualiser les stocks.",
      budgetFCFA: 1550000,
      timelineWeeks: 4,
      label: "Marie-Noëlle A. (Kira Cosmetics) — 1 550 000 FCFA"
    }
  ];

  // State handles
  const [form, setForm] = useState<ProspectForm>({
    name: presets[0].name,
    company: presets[0].company,
    problem: presets[0].problem,
    budgetFCFA: presets[0].budgetFCFA,
    timelineWeeks: presets[0].timelineWeeks
  });

  const [analyzing, setAnalyzing] = useState(false);
  const [analysisCompleted, setAnalysisCompleted] = useState(false);
  const [copiedResponse, setCopiedResponse] = useState(false);
  const [copiedSlack, setCopiedSlack] = useState(false);
  const [isSavedInHub, setIsSavedInHub] = useState(false);

  // Analysis result states
  const [decision, setDecision] = useState<"QUALIFIED" | "DISQUALIFIED">("DISQUALIFIED");
  const [criteria, setCriteria] = useState({
    budget: { score: 80, text: "800 000 FCFA (Sous le seuil d'intégration handCode de 1 000 000 FCFA)", status: "error" as "error" | "success" | "warning" },
    maturity: { score: 95, text: "Élevée : Exigences de parsing de commandes et processus de dispatch clairs", status: "success" as "error" | "success" | "warning" },
    feasibility: { score: 100, text: "Excellente : Pile technologique idéale (Supabase, webhooks Make, API SMS/WhatsApp)", status: "success" as "error" | "success" | "warning" }
  });

  const [prospectResponse, setProspectResponse] = useState("");
  const [slackReport, setSlackReport] = useState("");

  const handleApplyPreset = (index: number) => {
    const selected = presets[index];
    setForm({
      name: selected.name,
      company: selected.company,
      problem: selected.problem,
      budgetFCFA: selected.budgetFCFA,
      timelineWeeks: selected.timelineWeeks
    });
    setAnalysisCompleted(false);
    setIsSavedInHub(false);
  };

  const handleClear = () => {
    setForm({
      name: "",
      company: "",
      problem: "",
      budgetFCFA: 0,
      timelineWeeks: 1
    });
    setAnalysisCompleted(false);
    setIsSavedInHub(false);
  };

  const triggerAnalysis = () => {
    if (!form.name || !form.company || !form.problem) return;
    setAnalyzing(true);
    setAnalysisCompleted(false);
    setIsSavedInHub(false);

    setTimeout(() => {
      // Step 1: Decision on budget threshold (1 000 000 FCFA)
      const isQualified = form.budgetFCFA >= 1000000;
      
      // Step 2: Establish metrics scores
      const budgetStatus = isQualified ? "success" : "error";
      const budgetText = `${form.budgetFCFA.toLocaleString("fr-FR")} FCFA ${isQualified ? "(Conforme au seuil minimum d'accompagnement de 1 000 000 FCFA)" : "(Inférieur au seuil minimum requis pour une intégration sur-mesure de 1 000 000 FCFA)"}`;
      
      const isMaturityHigh = form.problem.length > 50 && (form.problem.toLowerCase().includes("système") || form.problem.toLowerCase().includes("automatiser") || form.problem.toLowerCase().includes("commande") || form.problem.toLowerCase().includes("commandes") || form.problem.toLowerCase().includes("livreur") || form.problem.toLowerCase().includes("stocks"));
      const maturityScore = isMaturityHigh ? 90 : 60;
      const maturityText = isMaturityHigh ? "Élevée : Résolution de problème et routage fonctionnel détaillés" : "Moyenne : Besoins à clarifier via un atelier d'idéation";

      const feasibilityScore = 95;
      const feasibilityText = "Optimale : Réalisable en NoCode / LowCode (Supabase DB, intégrateur Make, WhatsApp Business API)";

      setDecision(isQualified ? "QUALIFIED" : "DISQUALIFIED");
      setCriteria({
        budget: { score: isQualified ? 100 : 80, text: budgetText, status: budgetStatus as any },
        maturity: { score: maturityScore, text: maturityText, status: (isMaturityHigh ? "success" : "warning") as any },
        feasibility: { score: feasibilityScore, text: feasibilityText, status: "success" }
      });

      // Step 3: Write response for the prospect (French language, professional, highly contextual, compliant with [Hook] + [Feasibility] + [NextStep])
      if (isQualified) {
        setProspectResponse(
          `Bonjour ${form.name},\n\n` +
          `J'ai bien pris connaissance des besoins de ${form.company} concernant : "${form.problem.substring(0, 80)}...". C'est un cas d'usage classique de notre atelier de développement d'automatisation.\n\n` +
          `**Validation de faisabilité :**\n` +
          `Votre écosystème est 100% réalisable avec notre stack de prédilection. La mise en place d'une architecture unifiée sur Supabase Database connectée à l'API WhatsApp Business via des scénarios multi-étapes sous Make permettra de centraliser l'intégralité des commandes de manière stable en moins de ${form.timelineWeeks} semaines.\n\n` +
          `**Prochaine étape :**\n` +
          `Au vu de votre enveloppe budgétaire de ${form.budgetFCFA.toLocaleString("fr-FR")} FCFA, nous confirmons que le cahier des charges s'inscrit parfaitement dans notre scope. Je vous propose de planifier une session d'alignement de 15 minutes avec notre Architecte Fondateur pour valider les repères techniques. Veuillez choisir le créneau de votre convenance sur notre calendrier de diagnostic : https://calendly.com/handcode/cadrage \n\n` +
          `Au plaisir d'articuler votre infrastructure,\n` +
          `Le Directeur Commercial Virtuel de handCode`
        );

        setSlackReport(
          `🚨 **Nouveau Lead QUALIFIÉ (handCode CRM)**\n` +
          `• **Client** : ${form.name} (${form.company})\n` +
          `• **Opportunité** : Centrale d'automatisation commandée via Make\n` +
          `• **Budget estimé** : ${form.budgetFCFA.toLocaleString("fr-FR")} FCFA (~${Math.round(form.budgetFCFA / 655.957)} €) | Répartition validée dans le Pipeline.`
        );
      } else {
        setProspectResponse(
          `Bonjour ${form.name},\n\n` +
          `Je vous remercie chaleureusement pour l'intérêt que vous portez à l'expertise d'automatisation de l'agence handCode.\n\n` +
          `**Validation de faisabilité :**\n` +
          `Votre projet de centralisation des commandes WhatsApp associé à la notification instantanée de vos livreurs à Abidjan est de l'ordre du faisable absolu. C'est typiquement le type de flux transactionnels performants que nous aimons concevoir à l'aide de bases relationnelles de type Supabase.\n\n` +
          `**Conseil orienté & Redirection :**\n` +
          `Néanmoins, au vu de votre enveloppe budgétaire indicative de ${form.budgetFCFA.toLocaleString("fr-FR")} FCFA (qui se situe en deçà de notre seuil critique d'accompagnement sur-mesure clé en main qui est fixé à 1 000 000 FCFA), nous ne serons malheureusement pas en mesure d'opérer la conception intégralement au format agence.\n\n` +
          `Pour vous permettre de valider votre preuve de concept en 3 semaines, voici mes conseils d'architecture à assembler vous-même :\n` +
          `1. **Canal WhatsApp** : Utilisez des solutions comme Wati ou ManyChat. Vous pouvez poser des questions automatisées très simplement pour copier-coller les commandes.\n` +
          `2. **Centralisation** : Branchez un webhook Make (gratuit jusqu'à 1000 opérations/mois) pour copier ces éléments structurés directement de WhatsApp vers un tableur en ligne comme Google Sheets.\n` +
          `3. **Lancement de livraison** : Envoyez automatiquement une alerte ou un itinéraire à vos livreurs par webhook en se basant sur des pharmacies ou stations connues à l'aide de l'intégration SMS d'un opérateur.\n\n` +
          `Je reste à l'écoute de votre évolution s'il y a lieu,\n` +
          `Le Directeur Commercial Virtuel de handCode`
        );

        setSlackReport(
          `📩 **Notification Lead Non-Qualifié (Budget < 1 000 000 FCFA)**\n` +
          `Le prospect ${form.name} (${form.company}) a été réorienté automatiquement.\n` +
          `Sujet : ${form.problem.substring(0, 60)}... | Budget : ${form.budgetFCFA.toLocaleString("fr-FR")} FCFA.`
        );
      }

      setAnalyzing(false);
      setAnalysisCompleted(true);
    }, 1500);
  };

  const copyToClipboard = (text: string, type: "response" | "slack") => {
    navigator.clipboard.writeText(text);
    if (type === "response") {
      setCopiedResponse(true);
      setTimeout(() => setCopiedResponse(false), 2000);
    } else {
      setCopiedSlack(true);
      setTimeout(() => setCopiedSlack(false), 2000);
    }
  };

  const saveToCRM = () => {
    const isQual = form.budgetFCFA >= 1000000;
    // Map FCFA to EUR for the CRM (approximate rate 1 EUR = 656 FCFA)
    const subtotalInEur = Math.round(form.budgetFCFA / 655.957);

    const mockupBriefData = {
      prd: {
        summary: form.problem,
        targetAudience: isQual ? "Professionnels et clients cibles qualifiés" : "Clients de livraison locale",
        features: [
          { name: "Centrale relationnelle", desc: "Base Supabase pour centraliser les évènements de commande", priority: "Critique" },
          { name: "Ingestion automatique", desc: "Route de webhook et parsing via Make", priority: "Haute" }
        ],
        techStack: "Supabase DB, Make Integration Tool, Twilio SMS API"
      },
      specifications: {
        architecture: "Architecture légère Cloud LowCode : Webhook d'écoute > Script GPT-4 d'extraction > Base Supabase > Alerte mobile livreur.",
        styleDirection: "Finition dark mode épurée à contraste élevé.",
        technicalConstraints: "Forte résilience réseau, repères de navigation routière locaux d'Afrique de l'Ouest.",
        deliverables: ["Script d'exploitation Supabase", "Scénario d'automatisation Make", "Interface Dispatch"]
      },
      quote: {
        clientName: `${form.name} (${form.company})`,
        projectName: isQual ? "Centrale Multi-Canaux & Dispatch IA" : "Prototype WhatsApp & Google Sheets",
        items: [
          { description: "Modélisation base de données unifiée", hours: 8, rate: 25 },
          { description: "Intégration d'automatisation & Webhooks", hours: 12, rate: 25 }
        ],
        milestones: [
          { step: "Initialisation API", percentage: 50 },
          { step: "Validation & Mise en route", percentage: 50 }
        ],
        subtotal: subtotalInEur
      }
    };

    onSaveBrief(
      "brief",
      `Opportunité : ${form.company} (${isQual ? "Qualifié" : "Cadré / Redirigé"})`,
      mockupBriefData
    );

    setIsSavedInHub(true);
  };

  return (
    <div className="space-y-8 animate-fade-in text-xs max-w-5xl mx-auto">
      
      {/* 1. Header Banner of the commercial agent */}
      <div className="bg-gradient-to-r from-cyan-950 via-slate-950 to-black border border-cyan-500/20 p-6 rounded-2xl relative overflow-hidden">
        <div className="absolute right-4 top-4 opacity-5 pointer-events-none">
          <Bot className="h-32 w-32 text-cyan-400" />
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <span className="text-[10px] bg-cyan-900/40 border border-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider">
              AGENT INTELLIGENT
            </span>
            <h2 className="text-xl sm:text-2xl font-light tracking-tight text-white font-display">
              DIRECTEUR COMMERCIAL VIRTUEL d'handCode
            </h2>
            <p className="text-slate-400 leading-relaxed max-w-2xl text-[11px]">
              Cet agent virtuel gère l'évaluation de vos prospects entrants en 3 étapes. Il qualifie ou redirige les demandes selon vos critères opérationnels, rédige les courriels d'intérêt et peuple le CRM d'opportunités.
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab('dashboard')}
            className="self-start sm:self-center px-3.5 py-1.5 border border-white/5 bg-black hover:bg-white/5 rounded-lg text-slate-300 font-mono transition-colors"
          >
            ← Retour Cockpit
          </button>
        </div>

        {/* Core qualifications criteria parameters list */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 border-t border-white/5 pt-5 text-slate-400 text-[11px]">
          <div className="bg-black/40 p-3 rounded-xl border border-white/5 flex gap-2 w-full">
            <Coins className="h-4.5 w-4.5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white block">1. Seuil de budget</span>
              <p className="text-[10px] text-slate-500 mt-0.5">Écart minimum d'évaluation fixé à <strong className="text-cyan-400 font-mono">1 000 000 FCFA</strong> pour l'ingénierie sur-mesure clé en main.</p>
            </div>
          </div>
          <div className="bg-black/40 p-3 rounded-xl border border-white/5 flex gap-2 w-full">
            <Fingerprint className="h-4.5 w-4.5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white block">2. Maturité technique</span>
              <p className="text-[10px] text-slate-500 mt-0.5">Le client exprime un besoin fonctionnel structuré et des problèmes identifiés d'automatisation.</p>
            </div>
          </div>
          <div className="bg-black/40 p-3 rounded-xl border border-white/5 flex gap-2 w-full">
            <Briefcase className="h-4.5 w-4.5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white block">3. Stack Adéquation</span>
              <p className="text-[10px] text-slate-500 mt-0.5">Faisabilité assurée via base relationnelle ultra-légère <strong className="text-white">Supabase</strong> et workflows d'automation <strong className="text-white">Make</strong>.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Input form data */}
        <div className="lg:col-span-5 bg-black/40 border border-white/5 rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-white/5">
            <h3 className="text-xs uppercase tracking-widest text-slate-300 font-bold font-mono">
              📥 Données formulaire prospect
            </h3>
            <button 
              onClick={handleClear}
              className="text-[10px] text-slate-500 hover:text-white transition-colors"
            >
              Réinitialiser
            </button>
          </div>

          {/* Quick preset triggers */}
          <div className="space-y-1.5 pb-2">
            <p className="text-slate-500 text-[10px] font-mono leading-none">Sélectionner un cas d'étude réel :</p>
            <div className="flex flex-col gap-1.5">
              {presets.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(idx)}
                  className={`px-3 py-2 rounded-lg border text-left font-mono text-[10px] transition-all cursor-pointer flex justify-between items-center ${
                    form.name === p.name 
                      ? "bg-cyan-500/10 border-cyan-500/30 text-white font-bold"
                      : "bg-black/50 border-white/5 text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <span className="truncate">{p.label}</span>
                  <ChevronRight className="h-3 w-3 shrink-0 ml-1 opacity-60" />
                </button>
              ))}
            </div>
          </div>

          {/* Manual Input Fields */}
          <div className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-slate-500 text-[9px] uppercase font-mono font-bold block">Nom complet</label>
                <div className="relative">
                  <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-650" />
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-black/60 border border-white/10 rounded-lg p-2 pl-9 text-xs text-white placeholder-slate-700 outline-none focus:border-cyan-500/40 transition-colors"
                    placeholder="Jean-Luc K."
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-slate-500 text-[9px] uppercase font-mono font-bold block">Nom d'entreprise</label>
                <input
                  type="text"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  className="w-full bg-black/60 border border-white/10 rounded-lg p-2 text-xs text-white placeholder-slate-700 outline-none focus:border-cyan-500/40 transition-colors"
                  placeholder="Abidjan Resto-Livr"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-slate-500 text-[9px] uppercase font-mono font-bold block">Problème à automatiser</label>
              <textarea
                value={form.problem}
                onChange={(e) => setForm({ ...form, problem: e.target.value })}
                rows={5}
                className="w-full bg-black/60 border border-white/10 rounded-lg p-2.5 text-xs text-white placeholder-slate-700 outline-none focus:border-cyan-500/40 transition-colors leading-relaxed"
                placeholder="Exprimez précisément de quoi est constitué le projet d'intégration..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-slate-500 text-[9px] uppercase font-mono font-bold block">Enveloppe budget (FCFA)</label>
                <input
                  type="number"
                  value={form.budgetFCFA}
                  onChange={(e) => setForm({ ...form, budgetFCFA: Number(e.target.value) })}
                  className="w-full bg-black/60 border border-white/10 rounded-lg p-2 text-xs text-white outline-none focus:border-cyan-500/40 transition-colors font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-500 text-[9px] uppercase font-mono font-bold block">Délai estimé (semaines)</label>
                <input
                  type="number"
                  value={form.timelineWeeks}
                  onChange={(e) => setForm({ ...form, timelineWeeks: Number(e.target.value) })}
                  className="w-full bg-black/60 border border-white/10 rounded-lg p-2 text-xs text-white outline-none focus:border-cyan-500/40 transition-colors font-mono"
                />
              </div>
            </div>

            <button
              onClick={triggerAnalysis}
              disabled={analyzing || !form.name || !form.problem}
              className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black py-2.5 rounded-lg font-bold text-xs font-mono uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {analyzing ? (
                <>
                  <div className="h-3.5 w-3.5 rounded-full border border-black border-t-transparent animate-spin shrink-0" />
                  Calcul & Audit d'Opportunité...
                </>
              ) : (
                <>
                  <Zap className="h-3.5 w-3.5" />
                  Analyser la demande
                </>
              )}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Output Analysis Results & Drafts */}
        <div className="lg:col-span-7 space-y-6">
          
          {!analysisCompleted ? (
            <div className="bg-[#09090c]/40 border border-dashed border-white/5 rounded-2xl p-10 text-center flex flex-col items-center justify-center min-h-[440px] space-y-3">
              <div className="h-12 w-12 bg-white/5 rounded-full flex items-center justify-center text-slate-500">
                <Bot className="h-6 w-6" />
              </div>
              <div className="space-y-1 max-w-sm">
                <p className="text-slate-350 font-bold">En attente d'analyse d'opportunité</p>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Renseignez les données du prospect sur le volet de gauche ou cliquez sur un cas d'étude pour lancer l'audit opérationnel.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in text-xs">
              
              {/* Decision Indicator Badge Header */}
              <div className={`p-4 rounded-xl border flex items-center justify-between shadow-md ${
                decision === "QUALIFIED" 
                  ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-400"
                  : "bg-amber-950/20 border-amber-500/20 text-amber-500"
              }`}>
                <div className="flex items-center gap-3">
                  {decision === "QUALIFIED" ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-amber-500 shrink-0" />
                  )}
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-widest font-bold block">
                      DÉCISION DU DIRECTEUR COMMERCIAL
                    </span>
                    <h4 className="text-sm font-extrabold uppercase mt-0.5 tracking-tight font-display">
                      {decision === "QUALIFIED" 
                        ? `PROSPECT QUALIFIÉ (Envoi du lien Calendly)` 
                        : `PROSPECT NON-QUALIFIÉ (Redirection & Conseil orienté)`}
                    </h4>
                  </div>
                </div>
                
                <span className={`text-[10px] font-mono px-2.5 py-1 rounded border uppercase font-extrabold ${
                  decision === "QUALIFIED"
                    ? "bg-emerald-900/30 border-emerald-700/50 text-emerald-400"
                    : "bg-amber-900/30 border-amber-700/50 text-amber-500"
                }`}>
                  {decision === "QUALIFIED" ? "QUALIFIÉ" : "RECO-IA"}
                </span>
              </div>

              {/* Criteria details table checklist */}
              <div className="bg-black/40 border border-white/5 rounded-2xl p-5 space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  📊 Grille d'évaluation des critères d'adéquation
                </h4>
                
                <div className="space-y-3.5 pt-2.5">
                  {/* Budget */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-400 font-mono font-medium">Critère de Trésorerie (Budget minimum : 1M FCFA) :</span>
                      <span className={`font-bold font-mono ${criteria.budget.status === 'success' ? 'text-emerald-400' : 'text-rose-450'}`}>
                        {criteria.budget.score}% / Score
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${criteria.budget.status === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`} 
                        style={{ width: `${criteria.budget.score}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 font-sans mt-1 leading-normal italic">{criteria.budget.text}</p>
                  </div>

                  {/* Maturity */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-400 font-mono font-medium">Spécifications & Clarté du besoin :</span>
                      <span className="text-emerald-400 font-bold font-mono">
                        {criteria.maturity.score}% / Score
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full" 
                        style={{ width: `${criteria.maturity.score}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 font-sans mt-1 leading-normal italic">{criteria.maturity.text}</p>
                  </div>

                  {/* Feasibility */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-400 font-mono font-medium">Urgence & Compatibilité Stacks (Supabase/Make) :</span>
                      <span className="text-emerald-400 font-bold font-mono">
                        {criteria.feasibility.score}% / Score
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full" 
                        style={{ width: `${criteria.feasibility.score}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 font-sans mt-1 leading-normal italic">{criteria.feasibility.text}</p>
                  </div>
                </div>
              </div>

              {/* Draft Email Response Box Section */}
              <div className="bg-[#09090c] border border-white/5 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-3.5 bg-black/50 border-b border-white/5 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-cyan-400" />
                    <span className="font-bold font-mono text-white text-[11px] uppercase tracking-wider">
                      PROPOSITION DE RÉPONSE RÉDIGÉE (POUR LE PROSPECT)
                    </span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(prospectResponse, "response")}
                    className="flex items-center gap-1.5 text-[9px] uppercase font-mono text-slate-400 hover:text-white px-2 py-1 rounded bg-black border border-white/10 transition-colors cursor-pointer"
                  >
                    {copiedResponse ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-400" />
                        Copié !
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        Copier Mail
                      </>
                    )}
                  </button>
                </div>
                
                <div className="p-4 bg-black/30 font-sans text-slate-300 font-normal leading-relaxed whitespace-pre-line text-[11px] select-text">
                  {prospectResponse}
                </div>
              </div>

              {/* Slack reporting box */}
              <div className="bg-[#09090c] border border-white/5 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-3.5 bg-black/50 border-b border-white/5 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Slack className="h-4 w-4 text-cyan-400" />
                    <span className="font-bold font-mono text-white text-[11px] uppercase tracking-wider">
                      RAPPORT DE CADRAGE SIMPLIFIÉ (SLACK FOUNDER ALERT)
                    </span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(slackReport, "slack")}
                    className="flex items-center gap-1.5 text-[9px] uppercase font-mono text-slate-400 hover:text-white px-2 py-1 rounded bg-black border border-white/10 transition-colors cursor-pointer"
                  >
                    {copiedSlack ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-400" />
                        Copié !
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        Copier Slack
                      </>
                    )}
                  </button>
                </div>
                
                <div className="p-3.5 bg-cyan-950/5 font-mono text-cyan-300 whitespace-pre-line text-[11px]">
                  {slackReport}
                </div>
                <div className="px-3.5 py-2 bg-black/40 border-t border-white/5 text-[10px] text-slate-500 italic font-sans flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 bg-cyan-500 rounded-full animate-ping shrink-0" />
                  Rapport calibré sur un maximum absolu de 3 phrases pour libérer le temps de l'architecte.
                </div>
              </div>

              {/* Active integration triggers */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={saveToCRM}
                  disabled={isSavedInHub}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold font-mono uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 border ${
                    isSavedInHub 
                      ? "bg-black text-slate-500 border-white/5"
                      : "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500 hover:text-black font-extrabold"
                  }`}
                >
                  {isSavedInHub ? (
                    <>
                      <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400" />
                      Fiche d'Opportunité enregistrée
                    </>
                  ) : (
                    <>
                      <Plus className="h-4.5 w-4.5" />
                      Peupler fiche projet dans ARTISAN_OS
                    </>
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={() => onNavigateToTab('dashboard')}
                  className="px-5 py-3 rounded-xl border border-white/10 bg-black hover:bg-white/5 text-white transition-colors cursor-pointer font-mono font-bold uppercase tracking-wider"
                >
                  Aller au Pipeline CRM
                </button>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
