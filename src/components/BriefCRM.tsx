import React from "react";
import { 
  Briefcase, 
  TrendingUp, 
  Send, 
  CheckCircle, 
  XCircle, 
  Eye, 
  ArrowRight, 
  ArrowLeft, 
  RefreshCw,
  Trash2,
  Euro,
  Plus
} from "lucide-react";
import { SavedItem } from "../types";

interface BriefCRMProps {
  items: SavedItem[];
  onUpdateStatus: (id: string, status: 'draft' | 'sent' | 'won' | 'lost') => void;
  onDelete: (id: string) => void;
  onNavigateToTab: (tab: any) => void;
}

export default function BriefCRM({ items, onUpdateStatus, onDelete, onNavigateToTab }: BriefCRMProps) {
  const briefs = items.filter(item => item.type === "brief");

  // Get budget amount safely
  const getBudget = (item: SavedItem) => {
    return item.data?.calculatedTotals?.subtotal || item.data?.quote?.subtotal || 0;
  };

  // Group columns definition
  const COLUMNS = [
    {
      id: "draft" as const,
      title: "À revoir / Cadrage",
      subtitle: "Briefs générés non-envoyés",
      colorClass: "border-amber-500/10 bg-amber-950/5 text-amber-400",
      bulletColor: "bg-amber-400",
      accentBg: "border-amber-500/20"
    },
    {
      id: "sent" as const,
      title: "Envoi Client",
      subtitle: "Proposition commerciale active",
      colorClass: "border-blue-500/10 bg-blue-950/5 text-blue-400",
      bulletColor: "bg-blue-400",
      accentBg: "border-blue-500/20"
    },
    {
      id: "won" as const,
      title: "Signé / Gagné",
      subtitle: "Devis accepté & validé",
      colorClass: "border-emerald-500/10 bg-emerald-950/5 text-emerald-400",
      bulletColor: "bg-emerald-400",
      accentBg: "border-emerald-500/20"
    },
    {
      id: "lost" as const,
      title: "Sans suite",
      subtitle: "Négociation abandonnée",
      colorClass: "border-rose-500/10 bg-rose-950/5 text-rose-400",
      bulletColor: "bg-rose-400",
      accentBg: "border-rose-500/20"
    }
  ];

  // Sum budget for a status column
  const getColumnSubtotal = (status: 'draft' | 'sent' | 'won' | 'lost') => {
    return briefs
      .filter(b => (b.status || 'draft') === status)
      .reduce((sum, b) => sum + getBudget(b), 0);
  };

  return (
    <div className="space-y-6 animate-fade-in text-xs">
      
      {/* Mini CRM Overview bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-gradient-to-[#09090c] to-black border border-white/5 p-4 rounded-xl">
        <div className="space-y-1">
          <span className="text-slate-500 text-[9px] font-mono block uppercase">CA Sécurisé (Signé HT)</span>
          <p className="text-base font-extrabold text-emerald-400 leading-none font-mono">
            {getColumnSubtotal('won').toLocaleString('fr-FR')} €
          </p>
        </div>
        <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-white/5 pt-2 sm:pt-0 sm:pl-4">
          <span className="text-slate-500 text-[9px] font-mono block uppercase">Tuyau Négos (Envoyé HT)</span>
          <p className="text-base font-extrabold text-blue-400 leading-none font-mono">
            {getColumnSubtotal('sent').toLocaleString('fr-FR')} €
          </p>
        </div>
        <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-white/5 pt-2 sm:pt-0 sm:pl-4">
          <span className="text-slate-500 text-[9px] font-mono block uppercase">Dossiers en Cadrage (HT)</span>
          <p className="text-base font-extrabold text-amber-500 leading-none font-mono">
            {getColumnSubtotal('draft').toLocaleString('fr-FR')} €
          </p>
        </div>
        <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-white/5 pt-2 sm:pt-0 sm:pl-4 bg-cyan-950/10 -m-4 p-4 rounded-r-xl">
          <span className="text-cyan-400 text-[9px] font-mono block uppercase">CA Potentiel Total (HT)</span>
          <p className="text-base font-extrabold text-cyan-200 leading-none font-mono">
            {briefs.reduce((sum, b) => sum + getBudget(b), 0).toLocaleString('fr-FR')} €
          </p>
        </div>
      </div>

      {briefs.length === 0 ? (
        <div className="text-center py-12 bg-black/40 border border-white/5 rounded-2xl space-y-3.5">
          <div className="h-10 w-10 bg-white/5 rounded-full flex items-center justify-center mx-auto text-slate-500">
            <Briefcase className="h-5 w-5" />
          </div>
          <div className="max-w-xs mx-auto space-y-1">
            <p className="text-slate-400 font-semibold text-xs">Aucun brief commercial détecté</p>
            <p className="text-slate-500 text-[10px] leading-relaxed">
              Vos dossiers d'évaluation générés par l'IA apparaissent automatiquement ici sous forme de cartes d'opportunités.
            </p>
          </div>
          <button 
            type="button"
            onClick={() => onNavigateToTab('brief')}
            className="inline-flex items-center gap-1 bg-cyan-500 hover:bg-cyan-400 text-black px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-md"
          >
            <Plus className="h-3.5 w-3.5" />
            Créer un Brief
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start select-none">
          {COLUMNS.map(col => {
            const colBriefs = briefs.filter(b => (b.status || 'draft') === col.id);
            const colSum = getColumnSubtotal(col.id);

            return (
              <div 
                key={col.id}
                className="bg-[#09090c]/40 border border-white/5 rounded-xl flex flex-col min-h-[420px]"
              >
                {/* Column header */}
                <div className="p-3 border-b border-white/5 space-y-1 shrink-0">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <div className={`h-2 w-2 rounded-full ${col.bulletColor}`} />
                      <h3 className="font-bold text-white text-[11px] uppercase tracking-wide font-mono">{col.title}</h3>
                    </div>
                    <span className="text-[10px] font-mono bg-white/5 px-2 py-0.5 rounded-full text-slate-400 font-semibold">
                      {colBriefs.length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[9px] text-slate-500">
                    <span>{col.subtitle}</span>
                    <span className="font-mono text-slate-350">{colSum.toLocaleString('fr-FR')} € HT</span>
                  </div>
                </div>

                {/* Cards area */}
                <div className="p-2 gap-2 flex flex-col flex-1 overflow-y-auto max-h-[480px]">
                  {colBriefs.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center p-6 border border-dashed border-white/5 rounded-lg mt-2 text-slate-600 italic text-[10px]">
                      Vide
                    </div>
                  ) : (
                    colBriefs.map(b => {
                      const client = b.data?.quote?.clientName || "Client inconnu";
                      const project = b.data?.quote?.projectName || "Projet sans nom";
                      const amount = getBudget(b);

                      return (
                        <div 
                          key={b.id} 
                          className={`bg-[#050508]/90 border hover:border-white/10 p-3 rounded-lg space-y-2.5 transition-all shadow-sm ${col.accentBg}`}
                        >
                          <div className="space-y-0.5">
                            <h4 className="text-white font-bold tracking-tight text-[11px] truncate leading-tight uppercase font-display">{project}</h4>
                            <p className="text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer truncate" onClick={() => onNavigateToTab('saved')}>
                              {client}
                            </p>
                          </div>

                          <div className="flex justify-between items-center border-t border-b border-white/5 py-1 font-mono text-[10px]">
                            <span className="text-slate-500">Budget HT :</span>
                            <span className="text-white font-bold">{amount.toLocaleString('fr-FR')} €</span>
                          </div>

                          {/* Trigger action pills buttons */}
                          <div className="flex justify-between items-center gap-1 pt-1">
                            <button
                              onClick={() => {
                                onNavigateToTab('saved'); 
                              }}
                              title="Consulter le PRD et cahier des charges de ce projet"
                              className="px-2 py-1 bg-white/5 hover:bg-white/10 transition-colors rounded text-[9px] text-slate-300 font-mono tracking-tight cursor-pointer shrink-0 flex items-center gap-1"
                            >
                              <Eye className="h-3 w-3" />
                              Ouvrir
                            </button>

                            <div className="flex gap-1 shrink-0">
                              {/* Move backward arrow option */}
                              {col.id === 'sent' && (
                                <button
                                  onClick={() => onUpdateStatus(b.id, 'draft')}
                                  title="Repasser en cadrage"
                                  className="w-[22px] h-[22px] rounded border border-white/5 bg-black/60 hover:bg-white/5 flex items-center justify-center text-slate-400 cursor-pointer"
                                >
                                  <ArrowLeft className="h-3 w-3" />
                                </button>
                              )}
                              {col.id === 'won' && (
                                <button
                                  onClick={() => onUpdateStatus(b.id, 'sent')}
                                  title="Repasser en discussion active"
                                  className="w-[22px] h-[22px] rounded border border-white/5 bg-black/60 hover:bg-white/5 flex items-center justify-center text-slate-400 cursor-pointer"
                                >
                                  <ArrowLeft className="h-3 w-3" />
                                </button>
                              )}
                              {col.id === 'lost' && (
                                <button
                                  onClick={() => onUpdateStatus(b.id, 'sent')}
                                  title="Relancer l'opportunité"
                                  className="w-[22px] h-[22px] rounded border border-white/5 bg-black/60 hover:bg-white/5 flex items-center justify-center text-slate-400 cursor-pointer"
                                >
                                  <RefreshCw className="h-2.5 w-2.5" />
                                </button>
                              )}

                              {/* Move forward actionable pills option */}
                              {col.id === 'draft' && (
                                <button
                                  onClick={() => onUpdateStatus(b.id, 'sent')}
                                  className="bg-cyan-500/10 hover:bg-cyan-500 hover:text-black hover:shadow-cyan-500 px-2 py-1 text-cyan-400 text-[9px] font-semibold border border-cyan-500/25 rounded cursor-pointer transition-all"
                                >
                                  Envoyer →
                                </button>
                              )}
                              {col.id === 'sent' && (
                                <>
                                  <button
                                    onClick={() => onUpdateStatus(b.id, 'lost')}
                                    title="Marquer perdu/sans suite"
                                    className="w-[22px] h-[22px] rounded border border-white/5 bg-black hover:bg-rose-950/40 text-rose-500 cursor-pointer flex items-center justify-center"
                                  >
                                    <XCircle className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => onUpdateStatus(b.id, 'won')}
                                    title="Signer l'affaire !"
                                    className="bg-emerald-500 hover:bg-emerald-400 text-black hover:shadow-emerald-500 font-bold px-2 py-1 text-[9px] rounded cursor-pointer transition-all flex items-center gap-0.5"
                                  >
                                    🚀 Signer
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
