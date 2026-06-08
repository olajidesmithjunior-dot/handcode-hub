import React, { useState } from "react";
import { 
  Send, 
  MessageSquare, 
  Settings, 
  Bookmark, 
  Check, 
  Play, 
  Sliders, 
  Clipboard, 
  ChevronRight, 
  ExternalLink, 
  Zap, 
  Sparkles,
  HelpCircle,
  FileCode,
  ArrowRight,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { ManyChatConfig } from "../types";

interface ManyChatTunnelerProps {
  onSave: (type: 'manychat', title: string, data: any) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  button?: {
    caption: string;
    url: string;
  };
  createdAt: string;
}

export default function ManyChatTunneler({ onSave }: ManyChatTunnelerProps) {
  // Config state
  const [personaPreset, setPersonaPreset] = useState("Friendly Copywriter");
  const [customPersona, setCustomPersona] = useState("");
  const [keywords, setKeywords] = useState("CODE, ARTISAN, SERVICES");
  const [objectivePreset, setObjectivePreset] = useState("Collecter l'adresse email");
  const [customObjective, setCustomObjective] = useState("");
  const [ctaText, setCtaText] = useState("Visiter le site");
  const [ctaUrl, setCtaUrl] = useState("https://handcode-labs.com");
  const [addLeadCapture, setAddLeadCapture] = useState(true);
  const [subscriberName, setSubscriberName] = useState("Alexandre");

  // UX states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [activePane, setActivePane] = useState<'simulation' | 'payload' | 'guide'>('simulation');

  // Interactive Simulator chat history
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "init",
      sender: "bot",
      text: "👋 Salut Alexandre ! Ravi de faire ta connaissance. Tu as envoyé le mot-clé déclencheur. Dis-moi, comment puis-je t'accompagner aujourd' hui sur ton projet ?",
      createdAt: new Date().toISOString()
    }
  ]);
  const [userInputValue, setUserInputValue] = useState("");

  const personas = [
    { name: "Friendly Copywriter", desc: "Amical, plein d'entrain, riche en émojis branchés et axé sur les bénéfices." },
    { name: "Tech Architect & Expert Dev", desc: "Précis, calme, professionnel, démontrant une autorité d'ingénieur." },
    { name: "High-Urgency Sales Consultant", desc: "Dynamique, axé sur l'action rapide, insistant sur la rareté des places." },
    { name: "Bot Concierge Support", desc: "Serviable, rigoureux, chaleureux, structuré par points clés clairs." },
    { name: "Personnalisé", desc: "Définis entièrement ton style d'écriture ci-dessous." }
  ];

  const objectives = [
    { label: "Collecter l'adresse email", desc: "Engager l'abonné à soumettre son courriel pour recevoir un guide gratuit ou bonus." },
    { label: "Qualifier le prospect & Prendre RDV", desc: "Poser des questions sur son CA/besoin et l'inciter à bloquer un créneau Calendly." },
    { label: "Vendre le service immédiatement", desc: "Présenter l'offre flash et l'orienter directement vers le lien de paiement Stripe/Stripe." },
    { label: "Rediriger vers le Portfolio & FAQ", desc: "Mettre en valeur tes réalisations passées et rassurer avec des avis vérifiés." },
    { label: "Personnalisé", desc: "Spécifie ton propre but de conversion." }
  ];

  const currentPersona = personaPreset === "Personnalisé" ? customPersona : personaPreset;
  const currentObjective = objectivePreset === "Personnalisé" ? customObjective : objectivePreset;

  const currentManyChatPayload = {
    version: "v2",
    content: {
      type: "instagram",
      messages: [
        {
          type: "text",
          text: chatMessages[chatMessages.length - 1]?.sender === 'bot' ? chatMessages[chatMessages.length - 1].text : "Réponse générée dynamiquement par Gemini...",
          buttons: [
            {
              type: "url",
              caption: ctaText.substring(0, 20),
              url: ctaUrl
            }
          ]
        }
      ]
    }
  };

  const handleSimulateInboundMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInputValue.trim()) return;

    const userMsgText = userInputValue;
    const userMsgId = Date.now().toString();

    // Append user message
    const updatedMessages = [
      ...chatMessages,
      {
        id: userMsgId,
        sender: 'user' as const,
        text: userMsgText,
        createdAt: new Date().toISOString()
      }
    ];
    setChatMessages(updatedMessages);
    setUserInputValue("");
    setLoading(true);
    setError(null);

    try {
      // Call endpoint `/api/manychat-dynamic`
      const response = await fetch("/api/manychat-dynamic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsgText,
          subscriber: { first_name: subscriberName },
          persona: currentPersona,
          keywords: keywords,
          objective: currentObjective,
          ctaText: ctaText,
          ctaUrl: ctaUrl,
          addLeadCapture: addLeadCapture
        })
      });

      if (!response.ok) {
        throw new Error("Erreur de communication avec le serveur intelligent.");
      }

      const rawJson = await response.json();
      
      // Parse content
      const msgData = rawJson?.content?.messages?.[0];
      const botReplyText = msgData?.text || "Une erreur est survenue lors de l'appel Gemini.";
      const botButton = msgData?.buttons?.[0];

      setChatMessages([
        ...updatedMessages,
        {
          id: (Date.now() + 1).toString(),
          sender: 'bot' as const,
          text: botReplyText,
          button: botButton ? { caption: botButton.caption, url: botButton.url } : undefined,
          createdAt: new Date().toISOString()
        }
      ]);
      setSaved(false);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Impossible de joindre le système IA.");
    } finally {
      setLoading(false);
    }
  };

  const resetChat = () => {
    setChatMessages([
      {
        id: "init",
        sender: "bot",
        text: `👋 Salut ${subscriberName} ! Ravi de faire ta connaissance. Tu as envoyé le mot-clé déclencheur. Dis-moi, comment puis-je t'accompagner aujourd' hui sur ton projet ?`,
        createdAt: new Date().toISOString()
      }
    ]);
  };

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(JSON.stringify(currentManyChatPayload, null, 2));
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  const handleSaveTunnel = () => {
    const configToSave: ManyChatConfig = {
      id: Date.now().toString(),
      persona: currentPersona,
      keywords,
      objective: currentObjective,
      ctaText,
      ctaUrl,
      addLeadCapture,
      createdAt: new Date().toISOString()
    };
    onSave('manychat', `Tunnel ManyChat (${currentPersona.substring(0,15)})`, configToSave);
    setSaved(true);
  };

  return (
    <div className="space-y-8 animate-fade-in" id="manychat-tunneler-container">
      
      {/* 1. SECTION TITLE & BIO */}
      <div className="border-b border-white/5 pb-5">
        <h1 className="text-2xl font-light tracking-tight text-white flex items-center gap-2.5 font-display">
          <MessageSquare className="h-6 w-6 text-cyan-400" />
          TUNNEL DE RÉPONSE DYNAMIQUES MANYCHAT
        </h1>
        <p className="text-slate-500 text-xs mt-1">
          Configure un auto-répondeur IA ultra-réactif pour Instagram & Messenger, teste-le en temps réel et connecte-le à ton compte ManyChat.
        </p>
      </div>

      {/* 2. GRID CONTROLS & WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: CONTROLS */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#0c0c0c] border border-white/5 rounded-2xl p-5 space-y-6 shadow-md">
            
            {/* Control Column Header */}
            <div className="flex items-center gap-2 border-b border-white/5 pb-3">
              <Sliders className="h-4 w-4 text-cyan-400" />
              <h3 className="text-xs uppercase font-mono tracking-wider font-bold text-white">Paramètres IA du Tunnel</h3>
            </div>

            {/* Inbound trigger name */}
            <div className="space-y-2">
              <label className="block text-[10px] text-slate-400 uppercase font-mono font-bold">Prénom abonné simulé</label>
              <input
                type="text"
                className="w-full bg-black border border-white/5 hover:border-slate-800 focus:border-cyan-500/50 rounded-lg px-3 py-2 text-xs text-white focus:outline-none placeholder-slate-700 transition-colors"
                placeholder="Ex. Alexandre"
                value={subscriberName}
                onChange={(e) => setSubscriberName(e.target.value)}
              />
            </div>

            {/* Persona Selecting */}
            <div className="space-y-2">
              <label className="block text-[10px] text-slate-400 uppercase font-mono font-bold">Persona / Style d'Écriture</label>
              <select
                className="w-full bg-black border border-white/5 hover:border-slate-800 focus:border-cyan-500/50 rounded-lg px-3 py-2 text-xs text-white focus:outline-none transition-colors"
                value={personaPreset}
                onChange={(e) => setPersonaPreset(e.target.value)}
              >
                {personas.map((p, idx) => (
                  <option key={idx} value={p.name}>{p.name}</option>
                ))}
              </select>
              <p className="text-[10px] text-slate-500">
                {personas.find(p => p.name === personaPreset)?.desc}
              </p>
              
              {personaPreset === "Personnalisé" && (
                <textarea
                  className="w-full bg-black border border-white/5 hover:border-slate-800 focus:border-cyan-500/50 rounded-lg p-3 text-xs text-white focus:outline-none mt-2 h-16 font-mono"
                  placeholder="Décris le ton: Ex. Expert en marketing, parle calmement, tutoie l'abonné, finit par un trait d'esprit..."
                  value={customPersona}
                  onChange={(e) => setCustomPersona(e.target.value)}
                />
              )}
            </div>

            {/* Inbound Keywords triggers */}
            <div className="space-y-2">
              <label className="block text-[10px] text-slate-400 uppercase font-mono font-bold">Mots-clés déclencheurs (ManyChat Triggers)</label>
              <input
                type="text"
                className="w-full bg-black border border-white/5 hover:border-slate-800 focus:border-cyan-500/50 rounded-lg px-3 py-2 text-xs text-white focus:outline-none placeholder-slate-700 transition-colors font-mono"
                placeholder="Ex. CODE, ARTISAN, SERVICES"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
              />
            </div>

            {/* Conversational Objectives */}
            <div className="space-y-2">
              <label className="block text-[10px] text-slate-400 uppercase font-mono font-bold">Objectif de conversion IA</label>
              <select
                className="w-full bg-black border border-white/5 hover:border-slate-800 focus:border-cyan-500/50 rounded-lg px-3 py-2 text-xs text-white focus:outline-none transition-colors"
                value={objectivePreset}
                onChange={(e) => setObjectivePreset(e.target.value)}
              >
                {objectives.map((o, idx) => (
                  <option key={idx} value={o.label}>{o.label}</option>
                ))}
              </select>
              <p className="text-[10px] text-slate-500">
                {objectives.find(o => o.label === objectivePreset)?.desc}
              </p>

              {objectivePreset === "Personnalisé" && (
                <textarea
                  className="w-full bg-black border border-white/5 hover:border-slate-800 focus:border-cyan-500/50 rounded-lg p-3 text-xs text-white focus:outline-none mt-2 h-16"
                  placeholder="Ex. Amener l'abonné à admettre ses lacunes en SEO pour l'envoyer vers l'audit d'Heuristique"
                  value={customObjective}
                  onChange={(e) => setCustomObjective(e.target.value)}
                />
              )}
            </div>

            {/* Custom Interactive CTA Buttons Config */}
            <div className="border-t border-white/5 pt-4 space-y-4">
              <h4 className="text-[11px] font-mono font-bold tracking-wider text-white uppercase">Configuration Bouton d'Action</h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="block text-[9px] text-slate-400 uppercase font-mono font-bold">Libellé du Bouton</label>
                  <input
                    type="text"
                    maxLength={20}
                    className="w-full bg-black border border-white/5 hover:border-slate-800 focus:border-cyan-500/50 rounded-lg px-3 py-2 text-xs text-white focus:outline-none transition-colors"
                    placeholder="Ex. Réserver appel"
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                  />
                  <span className="text-[8px] text-slate-600 font-mono">Max 20 caract.</span>
                </div>

                <div className="space-y-2">
                  <label className="block text-[9px] text-slate-400 uppercase font-mono font-bold">Lien URL de redirection</label>
                  <input
                    type="text"
                    className="w-full bg-black border border-white/5 hover:border-slate-800 focus:border-cyan-500/50 rounded-lg px-3 py-2 text-xs text-white focus:outline-none transition-colors font-mono"
                    placeholder="Ex. https://url.com"
                    value={ctaUrl}
                    onChange={(e) => setCtaUrl(e.target.value)}
                  />
                </div>
              </div>

              {/* Lead capture toggle */}
              <div className="flex items-center gap-3 bg-black p-3 border border-white/5 rounded-xl hover:border-cyan-500/15 transition-all">
                <input
                  type="checkbox"
                  id="add-lead"
                  className="rounded bg-black border-white/10 text-cyan-500 focus:ring-cyan-500/40 h-4 w-4"
                  checked={addLeadCapture}
                  onChange={(e) => setAddLeadCapture(e.target.checked)}
                />
                <label htmlFor="add-lead" className="cursor-pointer select-none space-y-0.5">
                  <span className="block text-xs font-bold text-white transition-colors">Capture Email Dynamique</span>
                  <span className="block text-[10px] text-slate-500">Demander l'email si besoin lors de la réponse</span>
                </label>
              </div>

            </div>

            {/* Master Action Buttons */}
            <div className="flex gap-3 border-t border-white/5 pt-4">
              <button
                type="button"
                onClick={resetChat}
                className="flex-1 bg-white/5 border border-white/5 hover:bg-white/10 text-white rounded-xl py-2.5 text-xs font-semibold tracking-wide font-mono transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Réinitialiser
              </button>

              <button
                type="button"
                onClick={handleSaveTunnel}
                disabled={chatMessages.length <= 1}
                className={`flex-1 border text-center flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold tracking-wide transition-all ${
                  saved
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    : chatMessages.length <= 1
                      ? "opacity-50 cursor-not-allowed bg-white/5 border-transparent text-slate-500"
                      : "bg-cyan-500 text-black border-transparent hover:bg-cyan-450 cursor-pointer shadow-[0_0_15px_rgba(255,107,0,0.2)]"
                }`}
              >
                <Bookmark className="h-3.5 w-3.5" />
                {saved ? "Sauvegardé !" : "Sauver Tunnel"}
              </button>
            </div>

          </div>

          {/* Alternative sans ManyChat PRO (Gratuit) */}
          <div className="bg-[#0c0c0c]/80 border border-amber-500/10 rounded-2xl p-5 space-y-4 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-500/5 to-transparent rounded-full blur-xl pointer-events-none"></div>
            
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
                <AlertCircle className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-amber-400 uppercase font-mono tracking-wider">💡 Alternative sans ManyChat PRO</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  L'<em>External Request</em> nécessite un abonnement ManyChat PRO. Si vous êtes sur l'offre gratuite, redirigez simplement en 1 clic :
                </p>
              </div>
            </div>

            <div className="bg-black/45 rounded-xl p-3.5 border border-white/5 space-y-2.5 text-xs font-sans">
              <div className="space-y-1">
                <span className="text-[9px] font-bold font-mono text-slate-500 uppercase">Étape 1 :</span>
                <p className="text-slate-300 leading-normal pl-2 border-l border-white/10">
                  Créez une réponse automatique classique sur mot-clé avec le bloc gratuit <strong className="text-white">"Send Message"</strong> (Envoyer un message).
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-bold font-mono text-slate-500 uppercase">Étape 2 :</span>
                <p className="text-slate-300 leading-normal pl-2 border-l border-white/10">
                  Rédigez votre texte et ajoutez-y un bouton avec pour titre <strong className="text-white">"{ctaText}"</strong>.
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-bold font-mono text-slate-500 uppercase">Étape 3 :</span>
                <p className="text-slate-300 leading-normal pl-2 border-l border-white/10">
                  Configurez le lien de destination classique vers votre site officiel :
                </p>
                <div className="flex items-center justify-between gap-2 bg-black/60 px-3 py-1.5 rounded-lg border border-amber-500/10 font-mono text-[10px] text-amber-200 mt-1">
                  <span className="truncate select-all">{ctaUrl}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(ctaUrl);
                    }}
                    className="text-[9px] text-amber-400 hover:underline shrink-0"
                  >
                    Copier
                  </button>
                </div>
              </div>
            </div>
            
            <p className="text-[10px] text-slate-500 italic leading-snug">
              Cette méthode gratuite est instantanée et évite les frais ManyChatPRO tout en maximisant votre taux de conversion vers <strong>{ctaUrl}</strong>.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: PREVIEW SCREEN (DYNAMIC COMPONENT TABPED) */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          
          {/* Navigation Tab selection */}
          <div className="flex gap-2 p-1 bg-black border border-white/5 rounded-xl shrink-0">
            <button
              onClick={() => setActivePane('simulation')}
              className={`flex-1 py-2 text-center rounded-lg text-xs font-semibold font-mono tracking-wider transition-colors flex items-center justify-center gap-1.5 ${
                activePane === 'simulation'
                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Zap className="h-4 w-4" />
              SIMULATEUR MESSENGER
            </button>
            
            <button
              onClick={() => setActivePane('payload')}
              className={`flex-1 py-2 text-center rounded-lg text-xs font-semibold font-mono tracking-wider transition-colors flex items-center justify-center gap-1.5 ${
                activePane === 'payload'
                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <FileCode className="h-4 w-4" />
              PAYLOAD JSON REQUIS
            </button>
            
            <button
              onClick={() => setActivePane('guide')}
              className={`flex-1 py-2 text-center rounded-lg text-xs font-semibold font-mono tracking-wider transition-colors flex items-center justify-center gap-1.5 ${
                activePane === 'guide'
                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <HelpCircle className="h-4 w-4" />
              GUIDE D'INSTALLATION
            </button>
          </div>

          {/* DYNAMIC CONTENT PANES */}
          <div className="flex-1 bg-black/30 border border-white/5 rounded-2xl p-6 min-h-[550px] flex flex-col justify-between">
            
            {/* A. INSTAGRAM / MESSENGER INTERACTIVE CHAT SIMULATION */}
            {activePane === 'simulation' && (
              <div className="flex flex-col h-full justify-between gap-6" id="chat-simulator-pane">
                
                {/* Simulated Device Frame Top header */}
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="h-9 w-9 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-[11px] font-bold shadow-sm">
                        DM
                      </div>
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-500 border border-black rounded-full"></span>
                    </div>
                    <div>
                      <h4 className="text-white text-xs font-bold leading-none font-sans flex items-center gap-1">
                        @artisan_conversations_bot
                      </h4>
                      <span className="text-[9px] text-slate-500 font-mono">ManyChat Direct IA Trigger Tunnel</span>
                    </div>
                  </div>
                  
                  <div className="text-[10px] bg-cyan-950 border border-cyan-500/15 px-2 py-0.5 rounded text-cyan-400 font-mono">
                    PROTOTYPE
                  </div>
                </div>

                {/* Simulated Messages Bubbles Screen area */}
                <div className="flex-1 overflow-y-auto space-y-4 max-h-[380px] min-h-[340px] pr-2 scrollbar-thin">
                  
                  {chatMessages.map((msg) => {
                    const isBot = msg.sender === 'bot';
                    return (
                      <div 
                        key={msg.id}
                        className={`flex flex-col max-w-[85%] ${isBot ? 'self-start align-left mr-auto' : 'self-end align-right ml-auto'}`}
                      >
                        {/* Speaker Indicator */}
                        <span className="text-[8px] text-slate-500 font-mono mb-1 ml-1">
                          {isBot ? "Assistant IA" : subscriberName}
                        </span>

                        {/* Speech Bubble */}
                        <div 
                          className={`rounded-2xl px-4 py-2 text-xs leading-relaxed ${
                            isBot 
                              ? "bg-[#18181b] text-slate-200 border border-white/5 rounded-tl-sm shadow-sm"
                              : "bg-cyan-500 text-black font-semibold rounded-tr-sm self-end"
                          }`}
                        >
                          {msg.text}
                        </div>

                        {/* Attached CTA Link Button */}
                        {isBot && msg.button && (
                          <a
                            href={msg.button.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-[10px] font-bold font-mono tracking-wider text-center py-2 px-3 mt-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 self-start cursor-pointer hover:shadow-cyan shadow-[0_0_10px_rgba(255,107,0,0.05)]"
                          >
                            <span>{msg.button.caption}</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    );
                  })}

                  {/* Loading status */}
                  {loading && (
                    <div className="flex flex-col max-w-[85%] self-start mr-auto animate-pulse">
                      <span className="text-[8px] text-slate-500 font-mono mb-1">Bots en cours de frappe...</span>
                      <div className="bg-[#18181b] text-slate-400 rounded-2xl px-4 py-3 text-xs border border-white/5 rounded-tl-sm flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                        <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                        <span className="text-[10px] text-slate-500 font-mono ml-1">Génération Gemini en cours...</span>
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="p-3 bg-red-950/20 border border-red-900/30 rounded-xl text-red-400 text-xs font-mono flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}
                </div>

                {/* Simulated text input form */}
                <form onSubmit={handleSimulateInboundMessage} className="relative mt-auto">
                  <input
                    type="text"
                    disabled={loading}
                    className="w-full bg-black border border-white/5 hover:border-slate-800 focus:border-cyan-500/50 rounded-xl pl-4 pr-12 py-3 text-xs text-white focus:outline-none placeholder-slate-700 disabled:opacity-50 transition-colors"
                    placeholder={`Écris un message en tant que ${subscriberName} (ex: "Quel est ton prix ?"...)`}
                    value={userInputValue}
                    onChange={(e) => setUserInputValue(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={loading || !userInputValue.trim()}
                    className="absolute right-2 top-2 p-1.5 h-8 w-8 rounded-lg bg-cyan-500 text-black hover:bg-cyan-450 flex items-center justify-center disabled:opacity-50 cursor-pointer transition-colors"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </form>
              </div>
            )}

            {/* B. DETAILED WEBHOOK JSON RES SCHEMA */}
            {activePane === 'payload' && (
              <div className="flex flex-col h-full justify-between gap-5" id="payload-code-pane">
                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-black/40 border border-white/5 rounded-xl px-4 py-3">
                    <div>
                      <h4 className="text-white text-xs font-mono font-bold uppercase tracking-wider">Format d'intégration de ManyChat</h4>
                      <p className="text-slate-550 text-[10px] mt-0.5">Le schéma officiel Dynamic Block JSON envoyé par ton serveur</p>
                    </div>
                    <button
                      onClick={handleCopyPayload}
                      className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 bg-cyan-500/5 hover:bg-cyan-500/10 border border-cyan-500/15 px-3 py-1.5 rounded-lg font-mono transition-colors cursor-pointer"
                    >
                      <Clipboard className="h-3.5 w-3.5" />
                      {copiedPayload ? "Copié !" : "Copier le JSON"}
                    </button>
                  </div>

                  <div className="bg-black/90 p-4 rounded-xl border border-white/5 font-mono text-[11px] text-cyan-200 overflow-auto max-h-[360px] whitespace-pre-wrap leading-relaxed select-all">
                    <code>{JSON.stringify(currentManyChatPayload, null, 2)}</code>
                  </div>
                </div>

                <div className="p-4 bg-slate-900/10 border border-white/5 rounded-xl space-y-2 mt-auto">
                  <span className="text-[10px] uppercase font-mono text-cyan-400 font-bold block">Pourquoi ce format ?</span>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    ManyChat possède un bloc d'intégration natif appelé <strong className="text-white">"External Request"</strong>. Lorsque ce bloc appelle ton webhook d'Artisan, ManyChat s'attend à recevoir exactement ce format JSON pour afficher les textes et les boutons dynamiquement dans Instagram sans utiliser d'API complexes.
                  </p>
                </div>
              </div>
            )}

            {/* C. VISUAL STEP-BY-STEP SETUP TOUR */}
            {activePane === 'guide' && (
              <div className="space-y-5 overflow-y-auto max-h-[480px] scrollbar-thin" id="guide-install-pane">
                
                <h4 className="text-white text-xs font-bold uppercase tracking-widest font-mono">Guide Complet de Liaison ManyChat + IA</h4>
                
                {/* Steps visual track */}
                <div className="space-y-4 font-sans text-xs">
                  
                  {/* Step 1 */}
                  <div className="flex gap-4 items-start bg-black/40 p-4 border border-white/5 rounded-xl">
                    <div className="h-6 w-6 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-mono font-bold shrink-0">
                      1
                    </div>
                    <div className="space-y-1.5">
                      <h5 className="text-white font-bold font-mono">Créer un Tunnel sur ManyChat</h5>
                      <p className="text-slate-400 leading-relaxed">
                        Sur la console ManyChat, crée un nouveau flux (Flow) démarrant par le déclencheur de message : <strong className="text-white">"Le mot-clé ({keywords}) est envoyé"</strong>.
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex gap-4 items-start bg-black/40 p-4 border border-white/5 rounded-xl">
                    <div className="h-6 w-6 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-mono font-bold shrink-0">
                      2
                    </div>
                    <div className="space-y-1.5">
                      <h5 className="text-white font-bold font-mono">Ajouter un bloc "External Request" (Requête Externe)</h5>
                      <p className="text-slate-400 leading-relaxed">
                        Pour lier l'IA, ManyChat utilise un module de requêtes extérieures. Voici l'emplacement exact pour le trouver :
                      </p>
                      <ul className="list-disc list-inside text-[11px] text-slate-300 space-y-1 pl-1 font-sans">
                        <li>Dans l'éditeur de flux (Flow Builder), tirez un trait depuis l'étape précédente ou cliquez sur <strong className="text-white">"+ Next Step"</strong> et sélectionnez <strong className="text-cyan-400">"Action"</strong>.</li>
                        <li>Dans le bloc Action de couleur jaune/orangée qui apparaît, cliquez à l'intérieur sur le bouton bleu <strong className="text-white">+ Action</strong>.</li>
                        <li>Un menu d'actions apparaît à gauche : utilisez la <strong>barre de recherche</strong> tout en haut et tapez <strong className="text-white">"External"</strong> ou <strong className="text-white">"Requête"</strong>. Or, faites défiler vers le bas jusqu'à la catégorie <strong>"Advanced" / "Integrations"</strong>.</li>
                        <li>Sélectionnez <strong className="text-cyan-400">"External Request"</strong> (Requête externe) pour l'ouvrir.</li>
                      </ul>
                      <p className="text-slate-400 leading-relaxed mt-2">
                        Configurez-la ensuite en méthode <strong className="text-cyan-400">POST</strong> avec l'adresse URL absolue suivante :
                      </p>
                      <div className="bg-black/80 px-3 py-2 rounded border border-white/5 font-mono text-[10px] text-cyan-200 select-all tracking-tight break-all">
                        {window.location.origin}/api/manychat-dynamic
                      </div>
                      <p className="text-[10px] text-amber-400/90 font-mono mt-1">
                        ⚠️ Note : L'External Request est une fonctionnalité premium nécessitant ManyChat PRO.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex gap-4 items-start bg-black/40 p-4 border border-white/5 rounded-xl">
                    <div className="h-6 w-6 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-mono font-bold shrink-0">
                      3
                    </div>
                    <div className="space-y-1.5">
                      <h5 className="text-white font-bold font-mono">Mapper le JSON de la requête</h5>
                      <p className="text-slate-400 leading-relaxed">
                        Dans l'onglet "Body" de ta requête ManyChat, envoie ce contenu au format JSON. ManyChat transmettra dynamiquement le message reçu et le prénom de l'abonné à Gemini :
                      </p>
                      <pre className="bg-black/90 p-3 rounded border border-white/5 font-mono text-[9px] text-slate-450 overflow-x-auto">
{`{
  "subscriber": {
    "first_name": "{{first_name}}"
  },
  "message": "{{last_input}}",
  "persona": "${currentPersona}",
  "keywords": "${keywords}",
  "objective": "${currentObjective}",
  "ctaText": "${ctaText}",
  "ctaUrl": "${ctaUrl}",
  "addLeadCapture": ${addLeadCapture}
}`}
                      </pre>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="flex gap-4 items-start bg-black/40 p-4 border border-white/5 rounded-xl">
                    <div className="h-6 w-6 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-mono font-bold shrink-0">
                      4
                    </div>
                    <div className="space-y-1.5">
                      <h5 className="text-white font-bold font-mono">Activer et Tester</h5>
                      <p className="text-slate-400 leading-relaxed">
                        Coche <strong className="text-white">"Response Type: Dynamic Block"</strong> dans ManyChat. Publie ton flux et envoie un mot-clé sur Instagram pour voir l'IA répondre en moins de 2 secondes !
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            )}

          </div>
        </div>

      </div>

    </div>
  );
}
