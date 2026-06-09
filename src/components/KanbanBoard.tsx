import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Plus, 
  Trash2, 
  Coins, 
  Calendar, 
  Building, 
  Move, 
  User, 
  Zap, 
  AlertTriangle, 
  RefreshCw,
  Clock,
  Briefcase,
  CheckCircle2,
  X,
  FileText,
  Globe,
  Sparkles,
  Send,
  Check,
  HelpCircle,
  Play
} from "lucide-react";
import { Lead, LeadStatus } from "../types/crm";

interface KanbanBoardProps {
  onNavigateToTab?: (tab: any) => void;
}

const COLUMNS: { status: LeadStatus; label: string; colorClass: string; bgClass: string; borderClass: string }[] = [
  { 
    status: 'À revoir', 
    label: 'Cadrage / À revoir', 
    colorClass: 'text-amber-500', 
    bgClass: 'bg-amber-500/5', 
    borderClass: 'border-amber-500/20' 
  },
  { 
    status: 'Envoi Client', 
    label: 'Proposition Envoyée', 
    colorClass: 'text-cyan-400', 
    bgClass: 'bg-cyan-500/5', 
    borderClass: 'border-cyan-500/20' 
  },
  { 
    status: 'En Closing', 
    label: 'En Négociation', 
    colorClass: 'text-purple-400', 
    bgClass: 'bg-purple-500/5', 
    borderClass: 'border-purple-500/20' 
  },
  { 
    status: 'Gagné', 
    label: 'Contrat Gagné 🚀', 
    colorClass: 'text-emerald-400', 
    bgClass: 'bg-emerald-500/5', 
    borderClass: 'border-emerald-500/20' 
  }
];

export default function KanbanBoard({ onNavigateToTab }: KanbanBoardProps) {
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [draggedOverCol, setDraggedOverCol] = useState<LeadStatus | null>(null);

  // New Lead Form State
  const [newLead, setNewLead] = useState({
    name: "",
    company: "",
    budgetFCFA: 1200000,
    status: "À revoir" as LeadStatus,
    description: ""
  });

  // Webhook and WhatsApp simulation states (Make.com Integration)
  const [activeSubView, setActiveSubView] = useState<'kanban' | 'make'>('kanban');
  const [webhookUrl, setWebhookUrl] = useState(() => {
    return localStorage.getItem('make_webhook_url') || 'https://hook.eu1.make.com/53hgab4129c851jnsew8nf13374l86uw';
  });
  const [senderName, setSenderName] = useState('Jean-Luc K.');
  const [rawMessage, setRawMessage] = useState(
    "Allô handCode, c'est Jean-Luc K. de Resto-Livr Abidjan ! Nous avons un budget de 800 000 FCFA pour connecter nos restaurants et nos livreurs d'Abidjan sur une database solide."
  );

  const [isSendingToWebhook, setIsSendingToWebhook] = useState(false);
  const [isSimulatingGemini, setIsSimulatingGemini] = useState(false);
  const [webhookResponse, setWebhookResponse] = useState<{ status?: number; statusText?: string; text?: string; error?: string } | null>(null);
  const [simulationLogs, setSimulationLogs] = useState<string[]>([]);
  const [simulatedExtraction, setSimulatedExtraction] = useState<any | null>(null);
  const [isSavedWebhookUrl, setIsSavedWebhookUrl] = useState(false);

  const handleSaveWebhookUrl = () => {
    localStorage.setItem('make_webhook_url', webhookUrl);
    setIsSavedWebhookUrl(true);
    setTimeout(() => setIsSavedWebhookUrl(false), 2000);
  };

  const applyPresetMessage = (preset: 'jeanluc' | 'marie' | 'salim') => {
    if (preset === 'jeanluc') {
      setSenderName('Jean-Luc K.');
      setRawMessage("Allô handCode, c'est Jean-Luc K. de Resto-Livr Abidjan ! Nous avons un budget de 800000 FCFA pour connecter nos restaurants et nos livreurs d'Abidjan sur une database solide.");
    } else if (preset === 'marie') {
      setSenderName('Marie-Noëlle A.');
      setRawMessage("Bonjour handCode, Marie-Noëlle de Kira Cosmetics. Nous cherchons un système intelligent pour synchroniser nos stocks de produits physiques à Lomé en automatique. Budget de 1550000 FCFA.");
    } else if (preset === 'salim') {
      setSenderName('Salim D.');
      setRawMessage("Salut handCode, Salim de Dakar Tech Logistics. J'ai un budget de 2400000 FCFA pour automatiser le dispatching de mes livreurs de colis basés à Dakar.");
    }
    setWebhookResponse(null);
    setSimulatedExtraction(null);
    setSimulationLogs([]);
  };

  const handleTriggerWebhook = async () => {
    if (!webhookUrl.trim() || !rawMessage.trim()) return;
    setIsSendingToWebhook(true);
    setWebhookResponse(null);
    try {
      const response = await fetch('/api/make-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl,
          message: rawMessage,
          sender: senderName
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setWebhookResponse({
          status: data.status,
          statusText: data.statusText,
          text: data.responseText
        });
      } else {
        setWebhookResponse({
          error: data.error || "Erreur de transmission inattendue."
        });
      }
    } catch (err: any) {
      setWebhookResponse({
        error: err.message || "Impossible de joindre le proxy du serveur."
      });
    } finally {
      setIsSendingToWebhook(false);
    }
  };

  const handleSimulateGemini = async () => {
    if (!rawMessage.trim()) return;
    setIsSimulatingGemini(true);
    setSimulatedExtraction(null);
    setSimulationLogs([
      "[SYSTEM] Initialisation de la simulation de routage...",
      "[SYSTEM] Envoi du message WhatsApp brut au parseur cognitif Google Gemini..."
    ]);

    try {
      const response = await fetch('/api/simulate-whatsapp-gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: rawMessage })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setSimulationLogs(prev => [
          ...prev,
          `[INTEL] Extraction sémantique terminée par Gemini avec succès :`,
          `  - Prospect : "${data.extracted.client_nom}"`,
          `  - Entreprise/Projet : "${data.extracted.entreprise}"`,
          `  - Budget Extrait : ${Number(data.extracted.budget).toLocaleString('fr-FR')} FCFA`,
          `  - Besoin : "${data.extracted.besoin}"`,
          `[DATABASE] Insertion de la fiche de cadrage dans la table 'leads' réussie. ID: ${data.lead.id}`,
          `[SYSTEM] Succès ! Redirection automatique vers le tableau de Kanban dans 3 secondes...`
        ]);
        setSimulatedExtraction(data.extracted);

        // Refresh leads list right away
        queryClient.invalidateQueries({ queryKey: ["leads"] });

        // Auto-back to Kanban board so the user can gaze at their card materializing
        setTimeout(() => {
          setActiveSubView('kanban');
        }, 3200);
      } else {
        setSimulationLogs(prev => [
          ...prev,
          `[ERROR] Le serveur a retourné une erreur : ${data.error || 'Inconnue'}`
        ]);
      }
    } catch (err: any) {
      setSimulationLogs(prev => [
        ...prev,
        `[ERROR] Connexion réseau ou serveur rompue : ${err.message}`
      ]);
    } finally {
      setIsSimulatingGemini(false);
    }
  };

  // Query to Fetch Leads
  const { data: dbResponse, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const res = await fetch("/api/leads");
      if (!res.ok) {
        throw new Error("Impossible de joindre l'API CRM.");
      }
      return res.json();
    }
  });

  const leads: Lead[] = dbResponse?.data || [];
  const isFallback = dbResponse?.isFallback ?? true;
  const warningMsg = dbResponse?.warning ?? "";

  // Mutation to update status (Used on dropped card)
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: LeadStatus }) => {
      const res = await fetch(`/api/leads/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (!res.ok) {
        throw new Error("Échec de la mise à jour du statut.");
      }
      return res.json();
    },
    onMutate: async ({ id, status }) => {
      // Optimistic updates
      await queryClient.cancelQueries({ queryKey: ["leads"] });
      const previousLeads = queryClient.getQueryData(["leads"]);

      queryClient.setQueryData(["leads"], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.map((lead: Lead) => 
            lead.id === id ? { ...lead, status } : lead
          )
        };
      });

      return { previousLeads };
    },
    onError: (err, variables, context) => {
      if (context?.previousLeads) {
        queryClient.setQueryData(["leads"], context.previousLeads);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    }
  });

  // Mutation to add new Lead
  const addLeadMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        throw new Error("Impossible d'ajouter le prospect.");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      setIsAddModalOpen(false);
      // Reset form
      setNewLead({
        name: "",
        company: "",
        budgetFCFA: 1200000,
        status: "À revoir",
        description: ""
      });
    }
  });

  // Mutation to delete Lead
  const deleteLeadMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/leads/${id}`, {
        method: "DELETE"
      });
      if (!res.ok) {
        throw new Error("Échec de la suppression.");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    }
  });

  // HTML5 Drag Handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, status: LeadStatus) => {
    e.preventDefault();
    if (draggedOverCol !== status) {
      setDraggedOverCol(status);
    }
  };

  const handleDrop = (e: React.DragEvent, targetStatus: LeadStatus) => {
    e.preventDefault();
    setDraggedOverCol(null);
    const leadId = e.dataTransfer.getData("text/plain");
    if (leadId) {
      updateStatusMutation.mutate({ id: leadId, status: targetStatus });
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLead.name) return;
    addLeadMutation.mutate({
      name: newLead.name,
      company: newLead.company,
      budget: newLead.budgetFCFA,
      status: newLead.status,
      description: newLead.description
    });
  };

  // Calculations for total statistics
  const totalEstimates = leads.reduce((acc, lead) => acc + (lead.budget || 0), 0);
  const wonEstimates = leads
    .filter(l => l.status === 'Gagné')
    .reduce((acc, lead) => acc + (lead.budget || 0), 0);
  const closingEstimates = leads
    .filter(l => l.status === 'En Closing')
    .reduce((acc, lead) => acc + (lead.budget || 0), 0);

  return (
    <div className="space-y-6 text-xs max-w-6xl mx-auto animate-fade-in">
      
      {/* Upper Status Bar & Warning Area */}
      {warningMsg && (
        <div className="bg-amber-950/20 border border-amber-500/20 p-4 rounded-xl flex items-start gap-3 text-amber-500 leading-relaxed text-[11px] animate-pulse">
          <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold underline uppercase tracking-wide block">Information pipeline relationnel</span>
            <p className="opacity-90">{warningMsg}</p>
          </div>
        </div>
      )}

      {/* Header Controls Block */}
      <div className="bg-gradient-to-r from-neutral-950 via-zinc-950 to-black border border-white/5 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[10px] bg-orange-500/10 border border-orange-500/30 text-orange-400 px-2 py-0.5 rounded-full font-mono font-bold uppercase tracking-widest">
            ARTISAN_OS PIPELINE
          </span>
          <h2 className="text-xl sm:text-2xl font-light text-white tracking-tight font-display uppercase">
            Cadrage & Suivi des Opportunités
          </h2>
          <p className="text-slate-500 text-[11px]">
            Visualisez et gérez le flux de prospects de l'agence handCode en déplaçant simplement les fiches de cadrage.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 border border-white/10 rounded-xl bg-black hover:bg-white/5 text-slate-400 transition-colors flex items-center justify-center gap-1.5"
            title="Rafraîchir les données"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            {isFetching ? "Ajustement..." : "Rafraîchir"}
          </button>
          
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-black font-extrabold font-mono uppercase tracking-wider rounded-xl shadow-lg shadow-orange-950/30 flex items-center gap-1.5 transition-all text-xs cursor-pointer"
          >
            <Plus className="h-4 w-4 stroke-[3px]" />
            Créer une Opportunité
          </button>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-white/5 pb-1 gap-2 font-mono">
        <button
          onClick={() => setActiveSubView('kanban')}
          type="button"
          className={`py-2 px-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
            activeSubView === 'kanban'
              ? "border-orange-500 text-white font-bold"
              : "border-transparent text-slate-500 hover:text-white"
          }`}
        >
          📊 Tableau de Suivi Kanban
        </button>
        <button
          onClick={() => setActiveSubView('make')}
          type="button"
          className={`py-2 px-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            activeSubView === 'make'
              ? "border-orange-500 text-orange-400 font-bold"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          🔌 Intégration Make & WhatsApp Webhook
          <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse shrink-0" />
        </button>
      </div>

      {activeSubView === 'kanban' ? (
        <>
          {/* Financial Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-black/40 border border-white/5 rounded-xl p-4 flex items-center gap-3.5 shadow-md">
              <div className="h-10 w-10 bg-orange-500/5 border border-orange-500/20 rounded-lg flex items-center justify-center text-orange-400 shrink-0">
                <Coins className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-500 font-bold tracking-wider">Volume Global du Pipeline</span>
                <p className="text-base font-mono font-bold text-white mt-0.5">
                  {totalEstimates.toLocaleString("fr-FR")} FCFA
                </p>
              </div>
            </div>

            <div className="bg-black/40 border border-white/5 rounded-xl p-4 flex items-center gap-3.5 shadow-md">
              <div className="h-10 w-10 bg-emerald-500/5 border border-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-400 shrink-0">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-500 font-bold tracking-wider font-bold">Signé / Chiffre d'affaires gagné</span>
                <p className="text-base font-mono font-bold text-emerald-400 mt-0.5">
                  {wonEstimates.toLocaleString("fr-FR")} FCFA
                </p>
              </div>
            </div>

            <div className="bg-black/40 border border-white/5 rounded-xl p-4 flex items-center gap-3.5 shadow-md">
              <div className="h-10 w-10 bg-purple-500/5 border border-purple-500/20 rounded-lg flex items-center justify-center text-purple-400 shrink-0">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-500 font-bold tracking-wider font-bold">En closing de contrat</span>
                <p className="text-base font-mono font-bold text-purple-400 mt-0.5">
                  {closingEstimates.toLocaleString("fr-FR")} FCFA
                </p>
              </div>
            </div>
          </div>

      {/* Main Kanban Columns Area */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-black/20 border border-white/5 rounded-2xl space-y-3">
          <div className="h-8 w-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 font-mono text-[11px] animate-pulse">Chargement de l'architecture CRM des leads...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-12">
          {COLUMNS.map((col) => {
            const columnLeads = leads.filter((l) => l.status === col.status);
            const totalColEst = columnLeads.reduce((acc, lead) => acc + (lead.budget || 0), 0);
            const isTargeted = draggedOverCol === col.status;

            return (
              <div
                key={col.status}
                onDragOver={(e) => handleDragOver(e, col.status)}
                onDrop={(e) => handleDrop(e, col.status)}
                onDragLeave={() => setDraggedOverCol(null)}
                className={`rounded-2xl border flex flex-col min-h-[480px] transition-all duration-200 ${
                  isTargeted 
                    ? "bg-orange-500/10 border-orange-500/40 shadow-inner scale-[1.01]" 
                    : "bg-black/30 border-white/5"
                }`}
              >
                {/* Column Name Header Banner */}
                <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/40 rounded-t-2xl">
                  <div className="space-y-0.5">
                    <h3 className={`font-mono uppercase font-bold tracking-wider ${col.colorClass}`}>
                      {col.label}
                    </h3>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {columnLeads.length} {columnLeads.length > 1 ? "leads" : "lead"}
                    </span>
                  </div>
                  
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300">
                    {totalColEst.toLocaleString("fr-FR")} F
                  </span>
                </div>

                {/* Cards Container */}
                <div className="flex-1 p-3.5 space-y-3 overflow-y-auto max-h-[500px]">
                  {columnLeads.length === 0 ? (
                    <div className="h-32 border border-dashed border-white/5 rounded-xl flex items-center justify-center text-center p-4">
                      <p className="text-slate-600 text-[10px] italic">Déposer une fiche ici</p>
                    </div>
                  ) : (
                    columnLeads.map((lead) => (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead.id)}
                        className="bg-[#0b0c10] border border-white/10 hover:border-orange-500/30 p-3.5 rounded-xl shadow-lg relative group cursor-grab active:cursor-grabbing transition-all space-y-2.5 interactive-card select-none"
                      >
                        {/* Card Hover Action Bar */}
                        <div className="absolute right-3 top-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              if (confirm(`Confirmez-vous l'archivage/suppression de ${lead.name} ?`)) {
                                deleteLeadMutation.mutate(lead.id);
                              }
                            }}
                            className="p-1 text-slate-600 hover:text-red-400 bg-white/5 hover:bg-white/10 border border-white/5 rounded transition-colors"
                            title="Supprimer définitivement"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Title & Metadata row */}
                        <div className="space-y-1 pr-6">
                          <span className="text-[9px] bg-white/5 border border-white/10 text-white font-semibold font-mono px-1.5 py-0.5 rounded">
                            {lead.company || "Particulier"}
                          </span>
                          <h4 className="text-[11.5px] font-extrabold text-white font-sans truncate tracking-tight pt-1">
                            {lead.name}
                          </h4>
                        </div>

                        {/* Description field */}
                        <p className="text-[10.5px] text-slate-400 leading-relaxed line-clamp-3">
                          {lead.description || "Aucun descriptif de cadrage spécifié."}
                        </p>

                        {/* Footer details info */}
                        <div className="pt-2 border-t border-white/5 flex items-center justify-between font-mono text-[9px] text-slate-500">
                          <div className="flex items-center gap-1">
                            <Coins className="h-3.5 w-3.5 text-orange-400 shrink-0" />
                            <span className="text-slate-300 font-bold">{lead.budget.toLocaleString("fr-FR")} FCFA</span>
                          </div>
                          
                          <div className="flex items-center gap-1" title="Date de dépôt de cadrage">
                            <Clock className="h-3 w-3" />
                            <span>
                              {new Date(lead.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                            </span>
                          </div>
                        </div>

                        {/* Draggability Handle indicator */}
                        <div className="pt-1.5 flex items-center justify-center opacity-45 group-hover:opacity-100 transition-opacity">
                          <div className="w-full h-1 border-t border-dashed border-white/10 group-hover:border-orange-500/20" />
                          <Move className="h-3 w-3 text-slate-650 shrink-0 mx-2" />
                          <div className="w-full h-1 border-t border-dashed border-white/10 group-hover:border-orange-500/20" />
                        </div>

                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
        </>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 font-mono text-xs text-slate-300 animate-fade-in pb-12">
          
          {/* Left panel - Inputs & Webhook Settings (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Real Webhook Configuration panel */}
            <div className="bg-[#0b0c10] border border-white/5 rounded-2xl p-5 space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Globe className="h-4 w-4 text-orange-500" />
                Lien Webhook Make.com
              </h3>
              
              <p className="text-slate-400 text-[11px] leading-relaxed font-sans mt-1">
                Indiquez l'URL cible de votre Webhook personnalisé dans Make.com. Les simulations y enverront un payload JSON avec le message de WhatsApp.
              </p>

              <div className="space-y-2">
                <div className="flex gap-2 text-xs">
                  <input
                    type="text"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    className="flex-1 bg-black border border-white/10 rounded-xl p-2.5 text-slate-200 focus:border-orange-500/40 outline-none text-[10px]"
                    placeholder="https://hook.eu1.make.com/..."
                  />
                  <button
                    onClick={handleSaveWebhookUrl}
                    type="button"
                    className="px-3.5 py-2.5 bg-neutral-900 border border-white/10 hover:border-orange-500/35 hover:bg-neutral-850 text-white font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1 text-[11px]"
                  >
                    {isSavedWebhookUrl ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        Sauvé !
                      </>
                    ) : (
                      "Sauver"
                    )}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const defaultUrl = "https://hook.eu1.make.com/53hgab4129c851jnsew8nf13374l86uw";
                    setWebhookUrl(defaultUrl);
                    localStorage.setItem("make_webhook_url", defaultUrl);
                    setIsSavedWebhookUrl(true);
                    setTimeout(() => setIsSavedWebhookUrl(false), 2000);
                  }}
                  className="text-[9px] text-slate-500 hover:text-orange-400 font-mono underline block text-left cursor-pointer"
                >
                  Réinitialiser au webhook Make de Jean-Luc (53hgab...)
                </button>
              </div>
            </div>

            {/* Live WhatsApp Simulator Console */}
            <div className="bg-[#0b0c10] border border-white/5 rounded-2xl p-5 space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Zap className="h-4 w-4 text-orange-500 font-mono" />
                Simulateur de Message WhatsApp
              </h3>

              {/* Study Case presets selector */}
              <div className="space-y-1.5 font-mono">
                <span className="text-[9.5px] uppercase text-slate-500 font-bold block">Charger un message d'étude :</span>
                <div className="grid grid-cols-1 gap-1.5 animate-fade-in-down">
                  <button
                    type="button"
                    onClick={() => applyPresetMessage('jeanluc')}
                    className={`w-full py-2 px-3 border rounded-xl text-left bg-black hover:bg-white/5 text-[11px] font-sans flex justify-between items-center cursor-pointer transition-all ${
                      senderName === 'Jean-Luc K.' ? 'border-orange-500/40 text-orange-400 font-bold bg-orange-500/5' : 'border-white/5 text-slate-300'
                    }`}
                  >
                    <span>📱 Jean-Luc K. (Resto-Livr Abidjan)</span>
                    <span className="text-[9.5px] font-mono text-orange-400 font-bold shrink-0">800k F</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetMessage('marie')}
                    className={`w-full py-2 px-3 border rounded-xl text-left bg-black hover:bg-white/5 text-[11px] font-sans flex justify-between items-center cursor-pointer transition-all ${
                      senderName === 'Marie-Noëlle A.' ? 'border-orange-500/40 text-orange-400 font-bold bg-orange-500/5' : 'border-white/5 text-slate-300'
                    }`}
                  >
                    <span>📱 Marie-Noëlle (Kira Cosmetics Lomé)</span>
                    <span className="text-[9.5px] font-mono text-orange-400 font-bold shrink-0">1.55M F</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetMessage('salim')}
                    className={`w-full py-2 px-3 border rounded-xl text-left bg-black hover:bg-white/5 text-[11px] font-sans flex justify-between items-center cursor-pointer transition-all ${
                      senderName === 'Salim D.' ? 'border-orange-500/40 text-orange-400 font-bold bg-orange-500/5' : 'border-white/5 text-slate-300'
                    }`}
                  >
                    <span>📱 Salim D. (Dakar Logistics)</span>
                    <span className="text-[9.5px] font-mono text-orange-400 font-bold shrink-0">2.4M F</span>
                  </button>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-500 font-bold uppercase block">Expéditeur WhatsApp</label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-orange-500/40 text-xs"
                    placeholder="Nom du prospect"
                  />
                </div>

                <div className="space-y-1 font-sans">
                  <label className="text-[9px] text-slate-500 font-bold uppercase block font-mono">Texte Brut WhatsApp Reçu</label>
                  <textarea
                    value={rawMessage}
                    onChange={(e) => setRawMessage(e.target.value)}
                    rows={4}
                    className="w-full bg-black border border-white/10 rounded-xl p-3 text-slate-200 focus:border-orange-500/40 outline-none leading-relaxed text-[11px]"
                    placeholder="Saisissez le texte..."
                  />
                </div>

                {/* Simulated action buttons */}
                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={handleSimulateGemini}
                    disabled={isSimulatingGemini || isSendingToWebhook || !rawMessage.trim()}
                    className="w-full py-3 bg-orange-600 hover:bg-orange-500 disabled:bg-neutral-900 disabled:text-neutral-600 text-black font-extrabold uppercase rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs shadow-lg shadow-orange-950/25"
                  >
                    {isSimulatingGemini ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin text-black shrink-0" />
                        Extraction IA Gemini en cours...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 text-black shrink-0 animate-pulse" />
                        Extraction Gemini & Injection Directe
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleTriggerWebhook}
                    disabled={isSendingToWebhook || isSimulatingGemini || !webhookUrl.trim() || !rawMessage.trim()}
                    className="w-full py-3 bg-transparent hover:bg-white/5 border border-[#fc5c24]/20 hover:border-[#fc5c24]/85 text-[#fc5c24] disabled:border-white/5 disabled:text-slate-600 font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer text-[10.5px]"
                  >
                    {isSendingToWebhook ? (
                      <>
                        <Clock className="h-3.5 w-3.5 animate-spin text-slate-400 shrink-0" />
                        POST Webhook en cours...
                      </>
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5 shrink-0" />
                        Déclencher le Scénario Make (HTTP POST)
                      </>
                    )}
                  </button>
                </div>

              </div>

            </div>

          </div>

          {/* Right column - Logs Terminal & Integration Schema Guide (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            
            {/* Live Interactive Logger Terminal */}
            <div className="bg-[#050508] border border-white/10 rounded-2xl p-5 shadow-2xl flex flex-col min-h-[220px]">
              <div className="flex justify-between items-center pb-2 border-b border-white/5 mb-3 text-[9.5px]">
                <div className="flex items-center gap-2 text-slate-400 font-bold font-mono">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>CONSOLES DES SÉQUENCES COGNITIVES ARTISAN_OS</span>
                </div>
                <span className="text-[#fc5c24] font-bold uppercase font-mono">LIVE_FEED</span>
              </div>

              {/* Logs terminal content */}
              <div className="flex-1 space-y-2 font-mono text-[10.5px] text-[#21ebcd] leading-normal max-h-[160px] overflow-y-auto pr-2 select-text">
                {simulationLogs.length === 0 && !webhookResponse && (
                  <div className="text-slate-600 italic py-8 text-center font-mono">
                    En attente d'une commande d'émission...<br />
                    <span className="text-[9px] block mt-1.5 font-sans text-slate-500">Choisissez un cas à gauche et cliquez sur l'un des boutons de workflow pour observer.</span>
                  </div>
                )}

                {simulationLogs.map((log, idx) => {
                  let color = "text-[#21ebcd]";
                  if (log.includes("[ERROR]")) color = "text-rose-450 font-bold";
                  if (log.includes("[SUCCESS]")) color = "text-emerald-450 font-semibold";
                  if (log.includes("[SYSTEM]")) color = "text-slate-500";
                  if (log.includes("[INTEL]")) color = "text-amber-400 font-bold";
                  if (log.startsWith("  -")) color = "text-amber-350 pl-4";

                  return (
                    <p key={idx} className={color}>
                      {log}
                    </p>
                  );
                })}

                {webhookResponse && (
                  <div className="space-y-1.5 p-3 rounded-lg bg-black/60 border border-white/10 font-mono text-[10px] mt-2">
                    <div className="flex items-center gap-1.5 font-bold uppercase text-[9px] text-[#fc5c24]">
                      <span className="h-1.5 w-1.5 bg-[#fc5c24] rounded-full animate-ping" />
                      <span>Réponse HTTP Webhook Make</span>
                    </div>
                    {webhookResponse.error ? (
                      <p className="text-rose-400 font-bold">{webhookResponse.error}</p>
                    ) : (
                      <div className="space-y-1 text-slate-400 font-sans">
                        <p className="font-mono">• Statut HTTP : <span className="text-emerald-400 font-bold">{webhookResponse.status} {webhookResponse.statusText}</span></p>
                        <p className="font-mono">• Réponse brute : <span className="text-white bg-[#030303] border border-white/5 py-0.5 px-1.5 rounded text-[10px] select-all inline-block truncate max-w-xs">{webhookResponse.text || "Accepté (HTTP 200)"}</span></p>
                        <p className="text-[9px] text-orange-400 mt-2 italic leading-relaxed">
                          ⚡ Le message brut a été transmis avec succès au webhook de Make ! Dès qu'un message WhatsApp de Jean-Luc ou Marie-Noëlle arrive, Make envoie la donnée structurée vers notre CRM d'opportunités d'ARTISAN_OS. Les colonnes ont été actualisées de notre côté.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Step-by-step setup guide */}
            <div className="bg-black/40 border border-white/5 rounded-2xl p-5 space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-orange-500" />
                Guide : Comment Câbler Make.com & Supabase CRM
              </h3>

              <div className="space-y-3 font-sans text-[11px] leading-relaxed text-slate-400 bg-transparent">
                <p>
                  Pour automatiser l'intégration WhatsApp / Instagram dans ARTISAN_OS, créez simplement un scénario Make.com structuré comme suit :
                </p>

                <div className="space-y-2 font-mono text-[10.5px]">
                  <div className="p-3 bg-black/45 border border-white/5 rounded-xl space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-[9px] text-orange-400 uppercase">
                      <span className="bg-orange-500/10 text-orange-400 px-1.5 py-0.5 rounded">1</span> Custom Webhook (Make)
                    </div>
                    <p className="text-[10px] text-slate-400 font-sans">
                      Créez un module <strong>Webhooks {" > "} Custom Webhook</strong>. Make vous donnera l'URL de réception. Copiez cette URL et enregistrez-la à gauche.
                    </p>
                  </div>

                  <div className="p-3 bg-black/45 border border-white/5 rounded-xl space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-[9px] text-orange-400 uppercase">
                      <span className="bg-orange-500/10 text-orange-400 px-1.5 py-0.5 rounded">2</span> Google Gemini API
                    </div>
                    <p className="text-[10px] text-slate-400 font-sans">
                      Ajoutez un module <strong>Google Gemini {" > "} Generate Content</strong>. Définissez le prompt d'analyse :
                    </p>
                    <code className="text-[9px] text-[#21ebcd] bg-black p-1.5 rounded font-mono block mt-1 select-all border border-white/10 leading-normal">
                      "Analyse le message brute reçu : {`{{message}}`} et extrait un JSON valide : {`{ "client_nom": "...", "budget": 1000000, "besoin": "..." }`}."
                    </code>
                  </div>

                  <div className="p-3 bg-black/45 border border-white/5 rounded-xl space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-[9px] text-[#fc5c24] uppercase">
                      <span className="bg-orange-500/10 text-[#fc5c24] px-1.5 py-0.5 rounded">3</span> Requête HTTP de retour
                    </div>
                    <p className="text-[10px] text-slate-400 font-sans">
                      Ajoutez un module <strong>HTTP {" > "} Make a request</strong> pour écrire dans la table Supabase via notre API :
                    </p>
                    <div className="font-mono text-[9px] space-y-0.5 bg-black p-2.5 rounded border border-white/10 mt-1 leading-normal select-all">
                      <p className="text-orange-400">Method: POST</p>
                      <p className="text-cyan-400">URL: <span className="text-white">https://{window.location.host}/api/leads</span></p>
                      <p className="text-slate-550">Headers: Content-Type: application/json</p>
                      <p className="text-purple-400">Body JSON: <span className="text-white">{`{\n  "name": "{{client_nom}}",\n  "company": "WhatsApp Lead",\n  "budget": "{{budget}}",\n  "description": "{{besoin}}"\n}`}</span></p>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>

        </div>
      )}

      {/* Manual Entry Prospect Creation Modal overlay */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#08080c] border border-white/15 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-up">
            
            {/* Header modal banner */}
            <div className="p-4 bg-black border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4.5 w-4.5 text-orange-400" />
                <h3 className="font-extrabold uppercase font-mono tracking-widest text-[#FFF] text-xs">
                  Saisie d'un Nouveau Lead
                </h3>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Input body form content */}
            <form onSubmit={handleFormSubmit} className="p-5 space-y-4 text-xs font-mono">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase block">Nom du prospect</label>
                <input
                  type="text"
                  required
                  value={newLead.name}
                  onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                  className="w-full bg-black border border-white/10 focus:border-orange-500/50 outline-none rounded-lg p-2.5 text-white"
                  placeholder="Jean-Luc K."
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase block">Nom d'entreprise / Projet</label>
                <input
                  type="text"
                  value={newLead.company}
                  onChange={(e) => setNewLead({ ...newLead, company: e.target.value })}
                  className="w-full bg-black border border-white/10 focus:border-orange-500/50 outline-none rounded-lg p-2.5 text-white"
                  placeholder="Abidjan Resto-Livr"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase block">Budget (FCFA)</label>
                  <input
                    type="number"
                    value={newLead.budgetFCFA}
                    onChange={(e) => setNewLead({ ...newLead, budgetFCFA: Number(e.target.value) })}
                    className="w-full bg-black border border-white/10 focus:border-orange-500/50 outline-none rounded-lg p-2.5 text-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase block">Statut initial</label>
                  <select
                    value={newLead.status}
                    onChange={(e) => setNewLead({ ...newLead, status: e.target.value as LeadStatus })}
                    className="w-full bg-black border border-white/10 focus:border-orange-500/50 outline-none rounded-lg p-2.5 text-white cursor-pointer"
                  >
                    <option value="À revoir">Cadrage / À revoir</option>
                    <option value="Envoi Client">Proposition Envoyée</option>
                    <option value="En Closing">En Négociation</option>
                    <option value="Gagné">Contrat Gagné 🚀</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase block">Descriptif du problème de cadrage</label>
                <textarea
                  rows={4}
                  value={newLead.description}
                  onChange={(e) => setNewLead({ ...newLead, description: e.target.value })}
                  className="w-full bg-black border border-white/10 focus:border-orange-500/50 outline-none rounded-lg p-2.5 text-white font-sans select-text leading-relaxed text-[11px]"
                  placeholder="Expliquez ici brièvement les besoins techniques du prospect pour guider le travail de l'architecte..."
                />
              </div>

              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 rounded-lg border border-white/10 bg-black hover:bg-white/5 text-slate-350 transition-colors uppercase text-[10px]"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={addLeadMutation.isPending}
                  className="flex-1 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-black font-extrabold uppercase text-[10px] flex items-center justify-center gap-1 transition-all"
                >
                  {addLeadMutation.isPending ? "Sauvegarde..." : "Confirmer"}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
