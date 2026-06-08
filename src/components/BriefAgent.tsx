import React, { useState } from "react";
import { 
  FileText, 
  MessageSquare, 
  Sparkles, 
  Plus, 
  Trash2, 
  Save, 
  Clipboard, 
  CheckCircle, 
  Bot, 
  User, 
  Send, 
  RotateCcw, 
  ChevronRight, 
  Euro, 
  Clock, 
  Layers, 
  Palette, 
  ShieldAlert,
  Loader2,
  BookmarkCheck
} from "lucide-react";

interface BriefAgentProps {
  onSave: (type: "brief", title: string, data: any) => void;
}

interface Feature {
  name: string;
  desc: string;
  priority: string;
}

interface QuoteItem {
  description: string;
  hours: number;
  rate: number;
}

interface Milestone {
  step: string;
  percentage: number;
}

interface BriefResult {
  prd: {
    summary: string;
    targetAudience: string;
    features: Feature[];
    techStack: string;
  };
  specifications: {
    architecture: string;
    styleDirection: string;
    technicalConstraints: string;
    deliverables: string[];
  };
  quote: {
    clientName: string;
    projectName: string;
    items: QuoteItem[];
    milestones: Milestone[];
  };
}

interface ChatMessage {
  id: string;
  sender: "bot" | "user";
  text: string;
}

export default function BriefAgent({ onSave }: BriefAgentProps) {
  // Step 1: Client Setup Input
  const [setupMode, setSetupMode] = useState(true);
  const [clientName, setClientName] = useState("");
  const [projectName, setProjectName] = useState("");

  // Step 2: Interactive Conversational Brief
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Custom Answers Store
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});

  // Guided Questions from Brief Agent
  const guidedQuestions = [
    {
      id: "objective",
      question: "Quel est l'objectif principal de ce site web ou de cette application ? (ex: Landing page pour un produit, site vitrine, espace membre SaaS ou boutique e-commerce?)",
      suggestions: ["Landing Page ultra responsive", "Plateforme SaaS B2B", "Site Vitrine de Freelance", "Boutique en ligne minimaliste"]
    },
    {
      id: "style",
      question: "Quelle direction visuelle ou esthétique imaginez-vous ? (ex: Sombre et immersif, Épuré minimaliste, Orange Dark Néon, Corporate moderne et blanc ?)",
      suggestions: ["Sombre & Immersif Tech", "Orange Dark Néon Cyber", "Minimaliste Épuré Blanc", "Premium Luxueux Or & Noir"]
    },
    {
      id: "features",
      question: "Quelles sont les fonctionnalités indispensables ? (ex: Formulaire de contact intelligent, Passerelle Stripe, Tableau de bord interactif, Tunnel Instagram ManyChat?)",
      suggestions: ["Intégration ManyChat IA + Stripe", "Authentification + Dashboard", "Formulaire & Prise de RDV Calendly", "Système de Blog markdown"]
    },
    {
      id: "timeline",
      question: "Quel est votre budget indicatif ainsi que la deadline souhaitée pour le projet ?",
      suggestions: ["1500€ - 3000€ (3 semaines)", "3000€ - 7000€ (1 mois)", "Plus de 8000€ (Flexible)", "Budget ultra-serré"]
    }
  ];

  // Step 3: Brief Generation Result State
  const [result, setResult] = useState<BriefResult | null>(null);
  const [activeTab, setActiveTab] = useState<"prd" | "specs" | "quote">("prd");
  const [clipboardStatus, setClipboardStatus] = useState(false);

  // Initialize Chat Briefing session
  const handleStartBrief = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !projectName.trim()) return;

    setSetupMode(false);
    setChatMessages([
      {
        id: "welcome",
        sender: "bot",
        text: `Bonjour ${clientName} ! Je suis votre Agent de Cadrage IA. Ensemble, nous allons formaliser l'arbre des exigences de votre projet : "${projectName}". Je vais vous poser 4 questions clés pour dresser automatiquement votre PRD complet, votre Cahier des charges technique et votre Devis interactif chiffré.`
      },
      {
        id: "q-0",
        sender: "bot",
        text: guidedQuestions[0].question
      }
    ]);
  };

  // Submit Answer to chat
  const handleSendAnswer = (textToSend: string) => {
    if (!textToSend.trim()) return;

    const currentKey = guidedQuestions[currentQuestionIndex].id;
    const updatedAnswers = { ...answers, [currentKey]: textToSend };
    setAnswers(updatedAnswers);

    // Append user message
    const newMsgId = `user-a-${Date.now()}`;
    const newMsg: ChatMessage = {
      id: newMsgId,
      sender: "user",
      text: textToSend
    };

    const nextIndex = currentQuestionIndex + 1;
    let nextBotMessages: ChatMessage[] = [];

    if (nextIndex < guidedQuestions.length) {
      setCurrentQuestionIndex(nextIndex);
      nextBotMessages.push({
        id: `bot-q-${nextIndex}`,
        sender: "bot",
        text: guidedQuestions[nextIndex].question
      });
      setChatMessages(prev => [...prev, newMsg, ...nextBotMessages]);
    } else {
      // Set to max questions length so input zone correctly hides
      setCurrentQuestionIndex(guidedQuestions.length);
      nextBotMessages.push({
        id: "generating-notif",
        sender: "bot",
        text: "⚡ Parfait ! Toutes les réponses ont été collectées avec succès.\n\nJe commence l'analyse de vos besoins pour vous dresser un dossier d'architecture technique (PRD, Spécifications Ergonomiques) ainsi qu'un de vos devis d'accompagnement chiffré et dynamique."
      });
      setChatMessages(prev => [...prev, newMsg, ...nextBotMessages]);
      
      // Automatically trigger the dynamic dossier generation!
      handleGenerateDossier(updatedAnswers);
    }

    setUserInput("");
  };

  // Trigger Gemini dynamic generation
  const handleGenerateDossier = async (answersToUse?: { [key: string]: string }) => {
    setIsLoading(true);
    setErrorMsg(null);
    setIsSaved(false);
    const selectedAnswers = answersToUse || answers;
    try {
      const response = await fetch("/api/generate-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: selectedAnswers,
          clientName,
          projectName
        })
      });

      if (!response.ok) {
        throw new Error("Impossible de générer le dossier de brief pour le moment.");
      }

      const resData = await response.json();
      if (resData.success && resData.data) {
        setResult(resData.data);
      } else if (resData.error) {
        throw new Error(resData.error);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Une erreur est survenue lors de la communication de l'agent. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Devis edit utility functions (Make quote fully interactive) ---
  const handleUpdateQuoteItem = (index: number, key: keyof QuoteItem, value: any) => {
    if (!result) return;
    const updatedItems = [...result.quote.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [key]: value
    };

    setResult({
      ...result,
      quote: {
        ...result.quote,
        items: updatedItems
      }
    });
  };

  const handleAddQuoteItem = () => {
    if (!result) return;
    const newRow: QuoteItem = {
      description: "Nouvelle prestation personnalisée",
      hours: 10,
      rate: 80
    };
    setResult({
      ...result,
      quote: {
        ...result.quote,
        items: [...result.quote.items, newRow]
      }
    });
  };

  const handleDeleteQuoteItem = (idx: number) => {
    if (!result) return;
    const updatedItems = result.quote.items.filter((_, i) => i !== idx);
    setResult({
      ...result,
      quote: {
        ...result.quote,
        items: updatedItems
      }
    });
  };

  // Total Devis Calculations
  const calculateSubtotal = () => {
    if (!result) return 0;
    return result.quote.items.reduce((acc, item) => acc + (item.hours * item.rate), 0);
  };

  const subtotal = calculateSubtotal();
  const tva = Math.round(subtotal * 0.20);
  const totalTTC = subtotal + tva;

  // Save brief dossier to library
  const handleSaveBrief = () => {
    if (!result) return;
    // Embed updated mathematical totals before persisting
    const dataToSave = {
      ...result,
      calculatedTotals: {
        subtotal,
        tva,
        totalTTC
      }
    };
    onSave("brief", `Brief: ${result.quote.projectName} (${result.quote.clientName})`, dataToSave);
    setIsSaved(true);
  };

  // Reset briefing engine to start empty again
  const handleReset = () => {
    setSetupMode(true);
    setClientName("");
    setProjectName("");
    setChatMessages([]);
    setUserInput("");
    setCurrentQuestionIndex(0);
    setAnswers({});
    setResult(null);
    setIsSaved(false);
  };

  // Copy Markdown of the complete brief dossier
  const handleCopyToClipboard = () => {
    if (!result) return;
    
    let md = `# DOSSIER DE CADRAGE - ${result.quote.projectName.toUpperCase()}\n`;
    md += `**Client :** ${result.quote.clientName}\n`;
    md += `**Date :** ${new Date().toLocaleDateString()}\n\n`;
    
    md += `## 1. PRODUCT REQUIREMENT DOCUMENT (PRD)\n`;
    md += `### Résumé exécutif\n${result.prd.summary}\n\n`;
    md += `### Cible & Public d'Utilité\n${result.prd.targetAudience}\n\n`;
    md += `### Fonctionnalités Clés et Priorités\n`;
    result.prd.features.forEach(f => {
      md += `- **[Priorité ${f.priority}] ${f.name}** : ${f.desc}\n`;
    });
    md += `\n### Stack Technique Proposée\n${result.prd.techStack}\n\n`;

    md += `## 2. SPÉCIFICATIONS TECHNIQUES & CAHIER DES CHARGES\n`;
    md += `### Architecture / Arborescence\n${result.specifications.architecture}\n\n`;
    md += `### Direction Artistique et Identité\n${result.specifications.styleDirection}\n\n`;
    md += `### Contraintes de Résilience (Vitesse, RGPD)\n${result.specifications.technicalConstraints}\n\n`;
    md += `### Livrables Officiels\n`;
    result.specifications.deliverables.forEach(d => {
      md += `- ${d}\n`;
    });

    md += `\n## 3. DEVIS BUDGET RECOMMANDÉ (DYNAMIQUE)\n`;
    md += `| Prestation | Heures estimées | Taux Horaire (€) | Total HT (€) |\n`;
    md += `|---|---|---|---|\n`;
    result.quote.items.forEach(item => {
      md += `| ${item.description} | ${item.hours}h | ${item.rate}€/h | ${item.hours * item.rate}€ |\n`;
    });
    md += `\n**Total HT :** ${subtotal}€\n`;
    md += `**TVA (20%) :** ${tva}€\n`;
    md += `**Total TTC :** ${totalTTC}€\n\n`;

    md += `### Jalons de Facturation stratégiques\n`;
    result.quote.milestones.forEach(m => {
      md += `- ${m.step} : **${m.percentage}%** (${Math.round(totalTTC * (m.percentage / 100))}€ TTC)\n`;
    });

    navigator.clipboard.writeText(md).then(() => {
      setClipboardStatus(true);
      setTimeout(() => setClipboardStatus(false), 3000);
    });
  };

  return (
    <div className="space-y-6 animate-fade-in text-white/90">
      
      {/* Intro Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-cyan-900/10 to-transparent border border-white/5 p-6 rounded-2xl relative overflow-hidden">
        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(255,107,0,0.8)]"></span>
            <span className="text-[10px] font-mono tracking-widest text-cyan-400 font-bold uppercase">AI CO-ARTISAN AGENT</span>
          </div>
          <h2 className="text-xl font-light font-display">BRIEFING CLIENTS & CADRAGE TECHNIQUE IA</h2>
          <p className="text-xs text-slate-400">
            Menez un entretien dynamique structuré pour générer un PRD, Cahier de charges complet et Devis chiffré interactif modifiable.
          </p>
        </div>
        {result && (
          <button 
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg transition-all font-mono hover:bg-white/10 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Recommencer à zéro
          </button>
        )}
      </div>

      {/* --- STEP 1: INITIAL SETUP FORM --- */}
      {setupMode && !result && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-[#0a0a0c] border border-white/5 rounded-2xl p-6 relative">
            <h3 className="text-sm font-bold font-mono tracking-wider text-cyan-400 uppercase mb-4 flex items-center gap-2">
              <Layers className="h-4.5 w-4.5 text-cyan-400" /> initialisation du brief
            </h3>
            <form onSubmit={handleStartBrief} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block font-bold">Nom du Client / Marque</label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="ex: SAS WebStartup, Jean Dupont..."
                    className="w-full bg-black border border-white/5 hover:border-slate-800 focus:border-cyan-500/50 rounded-lg px-3 py-2 text-xs text-white focus:outline-none transition-colors"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block font-bold">Nom du Projet</label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="ex: Refonte SaaS v2, Landing Pitch..."
                    className="w-full bg-black border border-white/5 hover:border-slate-800 focus:border-cyan-500/50 rounded-lg px-3 py-2 text-xs text-white focus:outline-none transition-colors"
                    required
                  />
                </div>
              </div>

              <div className="bg-[#0e0e11] rounded-xl p-4 border border-white/5 space-y-2">
                <div className="flex gap-2 text-cyan-400">
                  <Bot className="h-4 w-4 shrink-0" />
                  <span className="text-[10px] font-bold font-mono uppercase tracking-wider">Comment ça marche ?</span>
                </div>
                <p className="text-[11px] text-slate-450 leading-relaxed">
                  Notre co-artisan IA va s'interfacer avec vous en mode conversationnel. À travers des questions ciblées, il va affiner les expressions de besoin, puis va automatiquement dresser un dossier complet de spécifications d'ingénieur et un projet de facture/devis modifiable.
                </p>
              </div>

              <button
                type="submit"
                className="w-full bg-cyan-500 text-black py-2.5 rounded-lg text-xs font-bold transition-all hover:bg-cyan-455 hover:shadow-[0_0_15px_rgba(255,107,0,0.3)] cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Démarrer l'entretien avec le co-artisan</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </form>
          </div>

          <div className="bg-black/60 border border-white/5 rounded-2xl p-6 space-y-4">
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400 border-b border-white/5 pb-2">
              Dossiers recommandés
            </h4>
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                <strong className="text-white block font-display">🌟 PRD (Product Requirement Document)</strong>
                <span className="text-[11px] text-slate-500 block mt-1 leading-relaxed">Un outil d'ingénierie pour recenser les récits utilisateurs, l'impact des fonctionnalités et aligner l'équipe technique.</span>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                <strong className="text-white block font-display">📐 Cahier des charges standard</strong>
                <span className="text-[11px] text-slate-500 block mt-1 leading-relaxed">Tout sur la direction de style, l'arborescence, les contraintes RGPD et de résilience web.</span>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                <strong className="text-white block font-display">🔧 Devis Interactif à la volée</strong>
                <span className="text-[11px] text-slate-500 block mt-1 leading-relaxed">Estimez les heures des modules de façon rationnelle. Ajoutez ou supprimez vos lignes et laissez la console recalculer la TVA.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- STEP 2: CONVERSATIONAL BRIEFING IN INTERACTION --- */}
      {!setupMode && !result && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-[#09090b] border border-white/5 rounded-2xl flex flex-col justify-between h-[480px] overflow-hidden relative shadow-lg">
            
            {/* Chat header */}
            <div className="bg-black border-b border-white/5 px-4 py-3 flex justify-between items-center select-none">
              <div className="flex items-center gap-2">
                <Bot className="h-4.5 w-4.5 text-cyan-400 animate-pulse" />
                <div>
                  <span className="text-xs font-bold text-white block">Briefing-Cluster // Co-Artisan</span>
                  <span className="text-[9px] text-slate-500 font-mono block leading-none">Projet : {projectName} | Client : {clientName}</span>
                </div>
              </div>
              <div className="text-[10px] font-mono text-cyan-450 bg-cyan-950/40 border border-cyan-800/40 px-2 py-0.5 rounded leading-none uppercase">
                Q: {Math.min(currentQuestionIndex + 1, guidedQuestions.length)} / {guidedQuestions.length}
              </div>
            </div>

            {/* Chat Messages scroll area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.map((msg) => {
                const isBot = msg.sender === "bot";
                return (
                  <div 
                    key={msg.id} 
                    className={`flex gap-3 max-w-[85%] ${isBot ? "self-start" : "self-end ml-auto flex-row-reverse"}`}
                  >
                    <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 border uppercase font-mono text-[9px] transition-all font-bold ${
                      isBot 
                        ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400" 
                        : "bg-white/10 border-white/20 text-white"
                    }`}>
                      {isBot ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                    </div>
                    <div>
                      <div className={`px-4 py-2.5 text-xs rounded-xl leading-relaxed whitespace-pre-line ${
                        isBot 
                          ? "bg-white/5 border border-white/5 text-slate-200" 
                          : "bg-cyan-500/10 border border-cyan-500/30 text-white shadow-[0_0_10px_rgba(255,107,0,0.05)] font-medium"
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  </div>
                );
              })}
              {isLoading && (
                <div className="flex gap-3 max-w-[85%] self-start animate-pulse">
                  <div className="h-7 w-7 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-400" />
                  </div>
                  <div>
                    <div className="px-4 py-2.5 text-xs rounded-xl bg-cyan-950/20 border border-cyan-800/20 text-cyan-400 font-mono flex items-center gap-2">
                       <span className="h-1.5 w-1.5 bg-cyan-400 rounded-full animate-ping"></span>
                       <span>Analyse IA en cours : modélisation du PRD, de l'architecture et du devis... Que le co-artisan commence !</span>
                    </div>
                  </div>
                </div>
              )}
              {errorMsg && (
                <div className="flex gap-3 max-w-[90%] self-center p-4 bg-red-500/10 border border-red-500/20 text-red-200 rounded-xl my-2 text-xs font-sans">
                  <div className="p-1 rounded-lg bg-red-500/20 text-red-400 shrink-0">
                    <ShieldAlert className="h-4 w-4" />
                  </div>
                  <div className="space-y-2">
                    <h5 className="font-bold text-red-300 font-mono tracking-wide">⚠️ Erreur de communication IA</h5>
                    <p className="text-slate-300 leading-relaxed text-[11px]">
                      {errorMsg.includes("503") || errorMsg.includes("high demand") || errorMsg.includes("UNAVAILABLE")
                        ? "Le serveur de génération de l'API Gemini subit un volume élevé d'appels. Le serveur va relancer la requête sur l'architecture robuste alternative pour continuer."
                        : errorMsg}
                    </p>
                    <button
                      onClick={() => handleGenerateDossier()}
                      className="px-3 py-1.5 rounded bg-red-500 hover:bg-red-600 text-white font-mono text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 duration-100"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Réessayer la génération
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Chips suggested quick-responses */}
            {currentQuestionIndex < guidedQuestions.length && guidedQuestions[currentQuestionIndex] && (
              <div className="px-4 py-2 bg-black border-t border-white/5 flex gap-2 overflow-x-auto select-none no-scrollbar">
                {guidedQuestions[currentQuestionIndex].suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendAnswer(suggestion)}
                    className="bg-white/5 hover:bg-cyan-500/10 hover:border-cyan-500/30 border border-white/5 text-slate-350 hover:text-white rounded-full px-3 py-1.5 text-[10px] font-mono shrink-0 transition-all cursor-pointer"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            {/* Input Form at bottom */}
            <div className="p-4 border-t border-white/5 bg-black">
              {currentQuestionIndex < guidedQuestions.length ? (
                <div className="relative">
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Écrivez votre réponse personnalisée ici..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSendAnswer(userInput);
                    }}
                    className="w-full bg-[#0a0a0a] border border-white/10 hover:border-slate-800 focus:border-cyan-500/50 rounded-xl pl-4 pr-12 py-3 text-xs text-white focus:outline-none transition-colors"
                  />
                  <button
                    onClick={() => handleSendAnswer(userInput)}
                    className="absolute right-2 top-2 p-1.5 h-8 w-8 rounded-lg bg-cyan-500 text-black hover:bg-cyan-450 flex items-center justify-center cursor-pointer transition-colors"
                  >
                    <Send className="h-4.5 w-4.5" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleReset}
                    className="w-full sm:w-auto flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 py-3 rounded-xl text-xs font-mono font-bold transition-all text-center cursor-pointer"
                  >
                    Modifier le setup du client
                  </button>
                  <button
                    onClick={handleGenerateDossier}
                    disabled={isLoading}
                    className="w-full sm:w-auto flex-[2] bg-cyan-500 text-black py-3 rounded-xl text-xs font-bold font-display uppercase tracking-wider transition-all hover:bg-[#ff4500] hover:shadow-[0_0_20px_rgba(255,107,0,0.45)] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Génération du brief complet IA...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        LANCER LA GÉNÉRATION DE DOSSIER
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* Setup / Side Summary overview */}
          <div className="bg-[#0a0a0c]/90 border border-white/5 rounded-2xl p-5 space-y-4">
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400 border-b border-white/5 pb-2">
              Progression de cadrage
            </h4>
            <div className="space-y-4 text-xs">
              <div className="space-y-1.5 border-l-2 border-white/10 pl-3">
                <span className="text-[10px] uppercase font-mono text-cyan-400 font-bold block">Client / Projet</span>
                <span className="text-white block font-semibold leading-tight">{clientName}</span>
                <span className="text-slate-400 block break-all leading-tight">Projet: {projectName}</span>
              </div>

              {guidedQuestions.map((q, idx) => {
                const answer = answers[q.id];
                return (
                  <div key={q.id} className="space-y-1.5 border-l-2 pl-3 transition-colors duration-250 border-cyan-800/40">
                    <span className="text-[10px] uppercase font-mono text-slate-500 block">
                      {idx + 1}. {q.id === "objective" ? "Objectifs" : q.id === "style" ? "Style direction" : q.id === "features" ? "Features indispensables" : "Budget & Timeline"}
                    </span>
                    {answer ? (
                      <span className="text-slate-200 block text-[11px] leading-relaxed italic">"{answer}"</span>
                    ) : (
                      <span className="text-slate-650 block text-[11px] font-mono">En attente de réponse...</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* --- STEP 3: DOSSIER RESULTS & EDITABLE DEVIS IN REALTIME --- */}
      {result && (
        <div className="space-y-6">
          
          {/* Quick Toolbar above Tabs */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-[#0a0a0c] border border-white/5 p-4 rounded-xl">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("prd")}
                className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all border ${
                  activeTab === "prd" 
                    ? "bg-cyan-500/10 border-cyan-500/30 text-white font-semibold"
                    : "bg-transparent border-transparent text-slate-400 hover:bg-white/5"
                }`}
              >
                1. Spécifications PRD
              </button>
              <button
                onClick={() => setActiveTab("specs")}
                className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all border ${
                  activeTab === "specs" 
                    ? "bg-cyan-500/10 border-cyan-500/30 text-white font-semibold"
                    : "bg-transparent border-transparent text-slate-400 hover:bg-white/5"
                }`}
              >
                2. Cahier des Charges
              </button>
              <button
                onClick={() => setActiveTab("quote")}
                className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all border ${
                  activeTab === "quote" 
                    ? "bg-cyan-500/10 border-cyan-500/30 text-white font-semibold"
                    : "bg-transparent border-transparent text-slate-400 hover:bg-white/5"
                }`}
              >
                3. Devis Chiffré Interactif
              </button>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={handleCopyToClipboard}
                className="flex items-center justify-center gap-1.5 text-xs text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-3.5 py-2.5 rounded-lg font-mono transition-colors cursor-pointer w-full sm:w-auto"
              >
                {clipboardStatus ? (
                  <>
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> Copié en Markdown !
                  </>
                ) : (
                  <>
                    <Clipboard className="h-3.5 w-3.5 text-cyan-400" /> Copier le Markdown Raw
                  </>
                )}
              </button>
              <button
                onClick={handleSaveBrief}
                disabled={isSaved}
                className={`flex items-center justify-center gap-1.5 text-xs px-4 py-2.5 rounded-lg font-bold transition-all cursor-pointer w-full sm:w-auto ${
                  isSaved
                    ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 cursor-default"
                    : "bg-cyan-500 text-black hover:bg-cyan-450 hover:shadow-[0_0_15px_rgba(255,107,0,0.25)]"
                }`}
              >
                {isSaved ? (
                  <>
                    <BookmarkCheck className="h-3.5 w-3.5" /> Dossier Sauvegardé
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" /> Sauvegarder dans bibliothèque
                  </>
                )}
              </button>
            </div>
          </div>

          {/* TAB CONTENT: 1. PRD (PRODUCT REQUIREMENT DOCUMENT) */}
          {activeTab === "prd" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
              <div className="md:col-span-2 space-y-6">
                
                {/* Summary Panel */}
                <div className="bg-[#09090c] border border-white/5 rounded-2xl p-6 relative overflow-hidden">
                  <h3 className="text-sm font-bold font-mono tracking-wider text-cyan-400 uppercase mb-3 flex items-center gap-2">
                    <FileText className="h-4.5 w-4.5" /> Résumé Exécutif & Vision Globale
                  </h3>
                  <p className="text-slate-200 text-xs leading-relaxed max-w-3xl whitespace-pre-line leading-relaxed">
                    {result.prd.summary}
                  </p>
                </div>

                {/* Features interactive matrix list */}
                <div className="bg-[#09090c] border border-white/5 rounded-2xl p-6 relative overflow-hidden">
                  <h3 className="text-sm font-bold font-mono tracking-wider text-cyan-400 uppercase mb-4 flex items-center gap-2">
                    <Layers className="h-4.5 w-4.5" /> Arbre des Fonctionnalités d'Ingénierie
                  </h3>
                  <div className="space-y-4">
                    {result.prd.features.map((feat, idx) => {
                      const isHigh = feat.priority.toLowerCase().includes("haut") || feat.priority.toLowerCase().includes("high");
                      return (
                        <div 
                          key={idx} 
                          className="bg-black/40 border border-white/5 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start gap-3 hover:border-cyan-500/10 transition-colors"
                        >
                          <div className="space-y-1">
                            <h4 className="text-xs font-bold text-white uppercase tracking-wider">{feat.name}</h4>
                            <p className="text-slate-400 text-xs leading-relaxed">{feat.desc}</p>
                          </div>
                          <span className={`text-[9px] font-mono px-2 py-0.5 rounded border uppercase font-bold shrink-0 ${
                            isHigh 
                              ? "bg-cyan-950 text-cyan-400 border-cyan-800" 
                              : "bg-white/5 text-slate-400 border-white/10"
                          }`}>
                            Prio: {feat.priority}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Side Meta Details */}
              <div className="space-y-6">
                
                {/* Target Audience User Personas */}
                <div className="bg-[#09090c] border border-white/5 p-5 rounded-2xl">
                  <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400 border-b border-white/5 pb-2 mb-3">
                    Publics requis & Cibles
                  </h4>
                  <p className="text-xs text-slate-350 leading-relaxed whitespace-pre-wrap">
                    {result.prd.targetAudience}
                  </p>
                </div>

                {/* Tech recommendations list */}
                <div className="bg-[#09090c] border border-white/5 p-5 rounded-2xl">
                  <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400 border-b border-white/5 pb-2 mb-3">
                    Architecture Stack recommandée
                  </h4>
                  <p className="text-xs text-slate-350 leading-relaxed whitespace-pre-wrap font-mono p-3 bg-black rounded-lg border border-white/5">
                    {result.prd.techStack}
                  </p>
                </div>

              </div>
            </div>
          )}

          {/* TAB CONTENT: 2. TECHNICAL SPECIFICATIONS (CAHIER DES CHARGES) */}
          {activeTab === "specs" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
              <div className="md:col-span-2 space-y-6">
                
                {/* Site map / System structure recommedations */}
                <div className="bg-[#09090c] border border-white/5 rounded-2xl p-6">
                  <h3 className="text-sm font-bold font-mono tracking-wider text-cyan-400 uppercase mb-3 flex items-center gap-2">
                    <Layers className="h-4.5 w-4.5" /> Arborescence de Navigation Proposée
                  </h3>
                  <div className="bg-black/40 p-4 rounded-xl border border-white/5 font-mono text-[11px] text-cyan-200 leading-relaxed whitespace-pre-wrap">
                    {result.specifications.architecture}
                  </div>
                </div>

                {/* Technical Constraints security / compliance / SEO details */}
                <div className="bg-[#09090c] border border-white/5 rounded-2xl p-6">
                  <h3 className="text-sm font-bold font-mono tracking-wider text-cyan-400 uppercase mb-3 flex items-center gap-2">
                    <ShieldAlert className="h-4.5 w-4.5" /> Résilience, Sécurité & RGPD
                  </h3>
                  <p className="text-slate-300 text-xs leading-relaxed whitespace-pre-line">
                    {result.specifications.technicalConstraints}
                  </p>
                </div>

              </div>

              {/* Specs side context bar */}
              <div className="space-y-6">
                
                {/* Visual / brand branding specs direction */}
                <div className="bg-[#09090c] border border-white/5 p-5 rounded-2xl">
                  <div className="flex gap-2 text-cyan-400 mb-3 border-b border-white/5 pb-2">
                    <Palette className="h-4 w-4 shrink-0" />
                    <span className="text-xs font-bold font-mono uppercase tracking-wider text-slate-350">Style & UI Design guide</span>
                  </div>
                  <p className="text-xs text-slate-350 leading-relaxed whitespace-pre-wrap">
                    {result.specifications.styleDirection}
                  </p>
                </div>

                {/* Deliverables checklist */}
                <div className="bg-[#09090c] border border-white/5 p-5 rounded-2xl">
                  <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400 border-b border-white/5 pb-2 mb-3">
                    Livrables Tangibles Remis
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {result.specifications.deliverables.map((item, idx) => (
                      <span 
                        key={idx}
                        className="text-[10px] bg-white/5 border border-white/5 hover:border-cyan-500/20 text-slate-300 font-mono py-1 px-2.5 rounded-md leading-none"
                      >
                        ✓ {item}
                      </span>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB CONTENT: 3. INTERACTIVE DEVIS CHIFFré CO-ARTISAN */}
          {activeTab === "quote" && (
            <div className="bg-[#09090c] border border-white/5 rounded-2xl p-6 relative overflow-hidden animate-fade-in space-y-6">
              
              {/* Invoice Layout Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start border-b border-white/5 pb-6">
                <div className="space-y-1">
                  <h3 className="text-lg font-light tracking-tight text-white font-display">DEVIS DE PRESTATION WEB & LABS</h3>
                  <span className="text-[10px] text-cyan-400 font-mono uppercase font-bold">Document Estimatif modifiable en temps réel</span>
                  <div className="text-slate-450 text-xs mt-3 space-y-0.5">
                    <p className="font-semibold text-white">Client : {result.quote.clientName}</p>
                    <p>Projet : {result.quote.projectName}</p>
                  </div>
                </div>
                <div className="text-right text-xs text-slate-500 space-y-0.5 font-mono mt-4 sm:mt-0">
                  <p>DEVIS_ID: DA-QU-{Math.floor(Math.random() * 90000) + 10000}</p>
                  <p>DATE: {new Date().toLocaleDateString()}</p>
                  <p>STATUT: PROJET DE TRAVAIL</p>
                </div>
              </div>

              {/* Dynamic calculations list and table headers */}
              <div className="overflow-x-auto select-none">
                <table className="w-full text-xs text-left text-slate-400">
                  <thead className="bg-[#050507] text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500 border-b border-white/5">
                    <tr>
                      <th scope="col" className="px-4 py-3">Description Prestation</th>
                      <th scope="col" className="px-4 py-3 text-center">Temps (Heures)</th>
                      <th scope="col" className="px-4 py-3 text-center">Taux Horaire (€)</th>
                      <th scope="col" className="px-4 py-3 text-right">Total HT (€)</th>
                      <th scope="col" className="px-4 py-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {result.quote.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-white/5 transition-colors">
                        
                        {/* Prestation description Input */}
                        <td className="px-4 py-3 min-w-[280px]">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleUpdateQuoteItem(idx, "description", e.target.value)}
                            className="bg-transparent border-b border-transparent hover:border-white/10 focus:border-cyan-500/50 text-white font-semibold focus:outline-none w-full transition-colors text-xs py-0.5"
                          />
                        </td>

                        {/* Estimated hours Input */}
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5 mx-auto max-w-[80px]">
                            <Clock className="h-3 w-3 text-slate-600" />
                            <input
                              type="number"
                              value={item.hours}
                              onChange={(e) => handleUpdateQuoteItem(idx, "hours", parseInt(e.target.value) || 0)}
                              className="bg-black border border-white/5 rounded px-2 py-1 text-center font-mono font-bold text-white focus:outline-none focus:border-cyan-500/50 w-14 text-xs"
                            />
                          </div>
                        </td>

                        {/* Hourly rate Input */}
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5 mx-auto max-w-[90px]">
                            <Euro className="h-3 w-3 text-slate-600" />
                            <input
                              type="number"
                              value={item.rate}
                              onChange={(e) => handleUpdateQuoteItem(idx, "rate", parseInt(e.target.value) || 0)}
                              className="bg-black border border-white/5 rounded px-2 py-1 text-center font-mono font-bold text-white focus:outline-none focus:border-cyan-500/50 w-16 text-xs"
                            />
                          </div>
                        </td>

                        {/* Calculated HT Total */}
                        <td className="px-4 py-3 font-mono font-bold text-right text-slate-200">
                          {Math.round(item.hours * item.rate)}€
                        </td>

                        {/* Delete single row */}
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleDeleteQuoteItem(idx)}
                            disabled={result.quote.items.length <= 1}
                            className="p-1 hover:bg-red-500/15 hover:border-red-500/30 border border-transparent text-slate-500 hover:text-red-400 rounded transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bottom Actions under Table */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <button
                  onClick={handleAddQuoteItem}
                  className="bg-white/5 hover:bg-cyan-500/10 hover:border-cyan-500/30 border border-white/10 text-slate-300 hover:text-white rounded-lg py-2 px-4 text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" /> Ajouter une prestation personnalisée
                </button>

                {/* Subtotals & calculations card readout */}
                <div className="w-full sm:w-[350px] bg-black/40 border border-white/5 rounded-xl p-4 space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-slate-450 border-b border-white/5 pb-2">
                    <span>Total HT :</span>
                    <span className="font-bold text-white">{subtotal}€</span>
                  </div>
                  <div className="flex justify-between text-slate-450 border-b border-white/5 pb-2">
                    <span>TVA Recommandée (20%) :</span>
                    <span className="font-bold text-white">{tva}€</span>
                  </div>
                  <div className="flex justify-between text-cyan-400 pt-1 text-sm font-bold">
                    <span>Total Estimé TTC :</span>
                    <span>{totalTTC}€</span>
                  </div>
                </div>
              </div>

              {/* Milestones dynamic list details */}
              <div className="bg-[#050507] p-5 border border-white/5 rounded-xl space-y-4">
                <div className="border-b border-white/5 pb-2">
                  <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400">
                    Milestones & Échéances de Facturation recommandées
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {result.quote.milestones.map((m, idx) => {
                    const priceAmount = Math.round(totalTTC * (m.percentage / 100));
                    return (
                      <div 
                        key={idx} 
                        className="bg-black/60 p-3.5 border border-white/5 rounded-xl space-y-1.5 relative"
                      >
                        <span className="text-[10px] font-mono text-cyan-400 font-bold block uppercase">Milestone {idx + 1}</span>
                        <h5 className="text-[11px] text-white leading-tight font-semibold block">{m.step}</h5>
                        <div className="flex justify-between pt-1 border-t border-white/5 items-center">
                          <span className="text-[10px] text-slate-500 font-mono tracking-tight font-bold">{m.percentage}% du projet</span>
                          <span className="text-xs font-mono font-bold text-white">{priceAmount}€ TTC</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
}
