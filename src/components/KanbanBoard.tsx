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
  FileText
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
            <span className="text-[10px] uppercase font-mono text-slate-500 font-bold tracking-wider">Signé / Chiffre d'affaires gagné</span>
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
            <span className="text-[10px] uppercase font-mono text-slate-500 font-bold tracking-wider">En closing de contrat</span>
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
