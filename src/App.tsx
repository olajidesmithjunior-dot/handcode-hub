import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  Code2, 
  FileText, 
  Palette, 
  Heart, 
  Terminal, 
  Laptop, 
  Menu, 
  X, 
  Code,
  ChevronRight,
  BookOpen,
  MessageSquare,
  Bot,
  Fingerprint,
  Sliders,
  Cpu
} from "lucide-react";

import BrandHub from "./components/BrandHub";
import BriefCRM from "./components/BriefCRM";

import SocialHub from "./components/SocialHub";
import CodeGenerator from "./components/CodeGenerator";
import CopySEO from "./components/CopySEO";
import DesignAssets from "./components/DesignAssets";
import SavedLibrary from "./components/SavedLibrary";
import ManyChatTunneler from "./components/ManyChatTunneler";
import BriefAgent from "./components/BriefAgent";
import CommercialAgent from "./components/CommercialAgent";
import KanbanBoard from "./components/KanbanBoard";
import ProjectGenerator from "./components/ProjectGenerator";
import Toast, { ToastMessage } from "./components/Toast";
import { SavedItem, ModuleType, BrandIdentity } from "./types";

export default function App() {
  const [activeTab, setActiveTab] = useState<ModuleType | 'dashboard' | 'brand'>('dashboard');
  const [dashboardView, setDashboardView] = useState<'overview' | 'crm'>('overview');
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const [brandIdentity, setBrandIdentity] = useState<BrandIdentity>({
    isActive: false,
    targetAudience: "Créateurs de SaaS, Solopreneurs & PME innovantes",
    editorialTone: "Professionnel, captivant, technique & pédagogique",
    primaryColor: "#06b6d4",
    secondaryColor: "#3b82f6",
    keywords: "intelligence artificielle, no-code, automatisation, productivité, business augmenté"
  });

  // Load saved assets on startup
  useEffect(() => {
    const saved = localStorage.getItem("digital_artisan_saved_items");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure our seed is always in the saved list if a seed was wiped or just merge it
        if (!parsed.some((item: any) => item.id === "seed-jean-luc")) {
          parsed.push(getJeanLucSeedItem());
          localStorage.setItem("digital_artisan_saved_items", JSON.stringify(parsed));
        }
        setSavedItems(parsed);
      } catch (err) {
        console.error("Failed to parse saved items:", err);
      }
    } else {
      const seedItems = [getJeanLucSeedItem()];
      setSavedItems(seedItems);
      localStorage.setItem("digital_artisan_saved_items", JSON.stringify(seedItems));
    }
    const savedBrand = localStorage.getItem("digital_artisan_brand_identity");
    if (savedBrand) {
      try {
        setBrandIdentity(JSON.parse(savedBrand));
      } catch (err) {
        console.error("Failed to parse brand identity:", err);
      }
    }
  }, []);

  // Helper function to return high quality seed data for prospect Jean-Luc K.
  function getJeanLucSeedItem(): SavedItem {
    return {
      id: "seed-jean-luc",
      type: "brief",
      title: "Cahier des charges : Centrale WhatsApp Abidjan (Jean-Luc K.)",
      createdAt: new Date().toISOString(),
      status: "draft",
      data: {
        prd: {
          summary: "Système intelligent de centralisation automatique des commandes de repas arrivant par WhatsApp à Abidjan, avec routage vers une base de données d'exploitation et alertes mobiles SMS/WhatsApp automatisées vers les livreurs.",
          targetAudience: "Livreurs à vélomoteur localisés en zones urbaines (Abidjan), équipe administrative interne Resto-Livr et clients sur WhatsApp.",
          features: [
            { name: "Réception WhatsApp Automatisée", desc: "Interception des messages et mémos vocaux de commande sur le compte WhatsApp Business via webhooks Make.", priority: "Critique" },
            { name: "Parser de Commandes IA (GPT-4)", desc: "Extraction automatique en JSON des plats commandés, quantité, prix, repères de livraison et profil client.", priority: "Haute" },
            { name: "Centrale de Dispatch (Supabase)", desc: "Tableau de gestion unifiée remplaçant les processus papier et WhatsApp direct des livreurs.", priority: "Haute" },
            { name: "Service de Notifications Drivers", desc: "Envoi automatique d'une fiche parcours et de l'itinéraire optimal en un clic par API WhatsApp.", priority: "Critique" },
            { name: "Correction d'Adresses Locale", desc: "Saisie intelligente avec repères visuels d'Abidjan (pharmacies, stations-services, carrefours connus) pour contrer le manque de numérotation.", priority: "Moyenne" }
          ],
          techStack: "Supabase Database relationnelle, Scénarios Make (Integromat), API OpenAI (GPT-4), Notifications SMS/WhatsApp."
        },
        specifications: {
          architecture: "Modèle NoCode / LowCode dynamique : Le bot WhatsApp reçoit la demande client. L'API OpenAI structure la commande dans la base centrale Supabase en temps réel. L'exploitant valide la commande qui distribue une notification automatique au livreur disponible par SMS webhooké.",
          styleDirection: "Finition Mobile-First à contraste élevé. Optimisé pour la lisibilité sur route et pour économiser les batteries.",
          technicalConstraints: "Forte résilience aux micro-coupures de réseau 3G/4G, adresses descriptives sans géolocalisation exacte (recherche sémantique par repères locaux).",
          deliverables: [
            "Script de création de base de données relationnelle Supabase",
            "Scénario d'automatisation Make fully-operational",
            "Console d'administration mobile-responsive pour dispatcher"
          ]
        },
        quote: {
          clientName: "Jean-Luc K. (Abidjan Resto-Livr)",
          projectName: "Centrale WhatsApp & Dispatch",
          items: [
            { description: "Modélisation de la base unifiée de commandes & utilisateurs (Supabase)", hours: 10, rate: 25 },
            { description: "Automatisation du canal d'écoute & IA de parsing des textes/vocaux (Make + OpenAI)", hours: 18, rate: 25 },
            { description: "Console web d'affectation et d'alerte livreurs optimisée mobile", hours: 12, rate: 25 },
            { description: "Tests en conditions de livraison réelles à Abidjan & ajustements", hours: 8, rate: 25 }
          ],
          milestones: [
            { step: "Architecture Base & Webhooks", percentage: 40 },
            { step: "Connectivité IA & Envoi Livreurs", percentage: 40 },
            { step: "Recette terrain & Go-Live", percentage: 20 }
          ],
          subtotal: 1220 // 1220 EUR is approx 800,000 FCFA, perfectly matching.
        }
      }
    };
  }

  // Save new items
  const handleSaveItem = (type: ModuleType, title: string, data: any) => {
    const newItem: SavedItem = {
      id: Date.now().toString(),
      type,
      title,
      data,
      createdAt: new Date().toISOString(),
      ...(type === 'brief' ? { status: 'draft' } : {}) // CRM default draft state
    };
    const updated = [newItem, ...savedItems];
    setSavedItems(updated);
    localStorage.setItem("digital_artisan_saved_items", JSON.stringify(updated));

    setToast({
      id: newItem.id,
      title: "Élément enregistré !",
      description: `"${title}" a été ajouté avec un statut initial de Cadrage dans votre Cockpit.`,
      type
    });
  };

  // Update item status for CRM Kanban pipeline
  const handleUpdateItemStatus = (id: string, status: 'draft' | 'sent' | 'won' | 'lost') => {
    const updated = savedItems.map(item => item.id === id ? { ...item, status } : item);
    setSavedItems(updated);
    localStorage.setItem("digital_artisan_saved_items", JSON.stringify(updated));

    const itemObj = savedItems.find(i => i.id === id);
    if (itemObj) {
      const frStatus = status === 'draft' ? 'À revoir' : status === 'sent' ? 'Envoyé' : status === 'won' ? 'Signé 🚀' : 'Sans suite';
      setToast({
        id,
        title: `Index CRM mis à jour`,
        description: `Le projet "${itemObj.title.replace("Brief: ", "")}" est classé : "${frStatus}"`,
        type: 'brief'
      });
    }
  };

  // Save brand identity setting changes
  const handleSaveBrandIdentity = (brand: BrandIdentity) => {
    setBrandIdentity(brand);
    localStorage.setItem("digital_artisan_brand_identity", JSON.stringify(brand));
  };

  // Calculate client brief quotes total financial sums for pipeline CRM metrics
  const calculateCRMRevenue = () => {
    let won = 0;
    let sent = 0;
    let draft = 0;

    savedItems.forEach(item => {
      if (item.type === 'brief') {
        const sub = item.data?.calculatedTotals?.subtotal || item.data?.quote?.subtotal || 0;
        let val = sub;
        if (!val && item.data?.quote?.items) {
          val = item.data.quote.items.reduce((acc: number, current: any) => acc + (Number(current.hours || 0) * Number(current.rate || 0)), 0);
        }
        
        const status = item.status || 'draft';
        if (status === 'won') won += val;
        else if (status === 'sent') sent += val;
        else if (status === 'draft') draft += val;
      }
    });

    return { won, sent, draft, total: won + sent + draft };
  };

  // Delete saved item
  const handleDeleteItem = (id: string) => {
    const updated = savedItems.filter(item => item.id !== id);
    setSavedItems(updated);
    localStorage.setItem("digital_artisan_saved_items", JSON.stringify(updated));
  };

  const handleNavigateToTab = (tab: ModuleType) => {
    setActiveTab(tab);
  };

  // Navigation menu items
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Laptop },
    { id: 'brand', label: 'ADN de Marque', icon: Fingerprint, badge: 'Hub' },
    { id: 'social', label: 'Réseaux & Branding', icon: Sparkles, badge: 'Social' },
    { id: 'code', label: 'Composants & Scripting', icon: Code2, badge: 'Dev' },
    { id: 'copy', label: 'Assistant Copy & SEO', icon: FileText, badge: 'Copy' },
    { id: 'design', label: 'Moodboard & SVG', icon: Palette, badge: 'Design' },
    { id: 'manychat', label: 'Auto-Tunnels IA', icon: MessageSquare, badge: 'ManyChat' },
    { id: 'brief', label: 'Brief IA & Devis', icon: Bot, badge: 'Agent' },
    { id: 'pipeline', label: 'Pipeline CRM ✦', icon: Sliders, badge: '/pipeline' },
    { id: 'commercial-agent', label: 'Agent Commercial ✦', icon: Bot, badge: 'DC' },
    { id: 'generator', label: 'Générateur de Projet ✦', icon: Cpu, badge: 'Bâtisseur' },
    { id: 'saved', label: 'Bibliothèque', icon: Heart, count: savedItems.length }
  ];

  return (
    <div className="min-h-screen bg-[#030303] text-slate-300 flex flex-col lg:flex-row font-sans">
      
      {/* 1. DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-white/5 bg-black/40 p-5 shrink-0 justify-between select-none">
        <div className="space-y-6">
          
          {/* Logo Brand Title with cyan tech look */}
          <div className="flex items-center gap-2.5 px-2">
            <div className="h-10 w-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(255,107,0,0.5)]">
              <Terminal className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white tracking-wider uppercase font-display leading-tight">HandCode</h2>
              <span className="text-[10px] text-cyan-400 font-mono tracking-widest block uppercase font-bold">Digital Artisan</span>
            </div>
          </div>

          {/* Navigation Links with tech border glows */}
          <nav className="space-y-1 pt-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-lg text-xs font-medium cursor-pointer transition-all border group ${
                    isActive
                      ? "bg-cyan-500/10 border-cyan-500/30 text-white font-semibold shadow-[0_0_15px_rgba(255,107,0,0.15)] active-glow"
                      : "bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4.5 w-4.5 transition-colors ${isActive ? "text-cyan-400 drop-shadow-[0_0_5px_rgba(255,107,0,0.4)]" : "text-slate-500 group-hover:text-slate-300"}`} />
                    <span>{item.label}</span>
                  </div>
                  
                  {/* Badges/Counters */}
                  {item.badge && !isActive && (
                    <span className="text-[9px] bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800/40 text-cyan-400 font-mono font-bold uppercase scale-90">
                      {item.badge}
                    </span>
                  )}
                  {item.count !== undefined && item.count > 0 && (
                    <span className="text-[10px] bg-cyan-900/30 border border-cyan-500/25 text-cyan-400 px-2 py-0.5 rounded-full font-mono font-bold">
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Legal Profile Credits */}
        <div className="border-t border-white/5 pt-4 flex items-center gap-3 bg-black/20 px-2 py-2.5 rounded-xl">
          <div className="h-8 w-8 rounded-full border border-white/10 p-0.5">
            <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center text-cyan-400 font-bold text-[10px] select-none font-mono">
              DA
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <span className="block text-xs font-bold text-white truncate">Artisan Solo</span>
            <span className="block text-[9px] font-mono text-slate-500 truncate leading-none">olajidesmithjunior@gmail.com</span>
          </div>
        </div>
      </aside>

      {/* 2. MOBILE HEADER & NAVIGATION DRAWER */}
      <div className="lg:hidden flex flex-col w-full select-none">
        <header className="p-4 border-b border-white/5 bg-[#030303] flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_10px_rgba(255,107,0,0.4)]">
              <Terminal className="h-4.5 w-4.5 text-white" />
            </div>
            <h2 className="text-xs font-extrabold text-white uppercase font-display tracking-widest select-none">HandCode</h2>
          </div>
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg border border-white/5 transition-all"
          >
            <Menu className="h-5 w-5" />
          </button>
        </header>

        {/* Drawer overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 animate-fade-in flex justify-end">
            <div className="w-64 bg-[#030303] p-5 h-full flex flex-col justify-between border-l border-white/5">
              <div className="space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-white/5">
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">Artisan Menu</span>
                  <button 
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg border border-white/5"
                  >
                    <X className="h-4.5 w-4.5" />
                  </button>
                </div>
                
                <nav className="space-y-1">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id as any);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-3 rounded-lg text-xs font-medium cursor-pointer transition-all border ${
                          isActive
                            ? "bg-cyan-500/10 border-cyan-500/20 text-white font-semibold"
                            : "bg-transparent border-transparent text-slate-400 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="h-4.5 w-4.5 text-cyan-400" />
                          <span>{item.label}</span>
                        </div>
                        {item.count !== undefined && item.count > 0 && (
                          <span className="text-[10px] bg-cyan-900/40 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded-full font-mono font-bold">
                            {item.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="border-t border-white/5 pt-4 text-xs font-mono">
                <span className="block font-bold text-white">Artisan Workspace</span>
                <span className="block text-[10px] text-slate-500 truncate mt-0.5">olajidesmithjunior@gmail.com</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. CENTRAL MAIN CANVAS SCREEN */}
      <main className="flex-1 p-4 sm:p-8 lg:p-10 max-w-7xl mx-auto w-full overflow-x-hidden min-h-screen flex flex-col justify-between">
        
        {/* Core Layout Inner Container to divide header + content */}
        <div className="space-y-10 flex-1 flex flex-col">
          
          {/* Global Immersive Header Control Bar */}
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-white/5">
            <div>
              <h1 className="text-2xl font-light tracking-tight text-white flex items-center gap-3 font-display">
                ARTISAN_OS <span className="text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-800/50 px-2 py-0.5 rounded font-mono uppercase tracking-widest font-bold">v1.4.2</span>
              </h1>
              <p className="text-xs text-slate-500 uppercase tracking-widest mt-1 font-mono">Solo Architect / Virtual Employee Cluster Alpha</p>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-[10px] text-slate-500 uppercase font-semibold font-mono">Neural Load</span>
                <div className="flex gap-1 mt-1">
                  <div className="w-3 h-1 bg-cyan-500 rounded-full shadow-[0_0_8px_rgba(255,107,0,0.6)]"></div>
                  <div className="w-3 h-1 bg-cyan-500 rounded-full shadow-[0_0_8px_rgba(255,107,0,0.6)]"></div>
                  <div className="w-3 h-1 bg-cyan-500 rounded-full shadow-[0_0_8px_rgba(255,107,0,0.6)]"></div>
                  <div className="w-3 h-1 bg-cyan-900 rounded-full"></div>
                  <div className="w-3 h-1 bg-cyan-950 rounded-full"></div>
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-full px-4 py-2 flex items-center gap-3">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-xs font-semibold text-slate-200 font-mono">API Cluster: Active</span>
              </div>
            </div>
          </header>

          {activeTab === 'dashboard' ? (
            /* --- EXCLUSIVE DASHBOARD LANDING OVERVIEW --- */
            <div className="space-y-10 animate-fade-in flex-1 flex flex-col justify-between">
              
              <div className="space-y-6">
                {/* Header Title Greeting */}
                <div className="space-y-2">
                  <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-white flex items-center gap-2.5 font-display">
                    <Sparkles className="h-6 w-6 text-cyan-400 shrink-0" />
                    CONSOLE ALL-IN-ONE ARTISAN
                  </h1>
                  <p className="text-slate-450 text-sm max-w-2xl leading-relaxed">
                    Bienvenue dans ton espace de travail augmenté. L'intelligence artificielle n'est pas un accessoire, c'est ton bras droit technique, créatif et commercial au quotidien.
                  </p>
                </div>

                {/* Dashboard Mode Switcher */}
                <div className="flex border-b border-white/5 pb-1 gap-2">
                  <button
                    onClick={() => setDashboardView('overview')}
                    className={`py-2.5 px-3 sm:px-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 font-mono flex items-center gap-2 cursor-pointer ${
                      dashboardView === 'overview'
                        ? "border-cyan-400 text-white font-bold"
                        : "border-transparent text-slate-500 hover:text-white"
                    }`}
                  >
                    🚀 Cockpit Outils & Métriques
                  </button>
                  <button
                    onClick={() => setDashboardView('crm')}
                    className={`py-2.5 px-3 sm:px-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 font-mono flex items-center gap-2 cursor-pointer ${
                      dashboardView === 'crm'
                        ? "border-cyan-400 text-cyan-400 font-bold"
                        : "border-transparent text-slate-500 hover:text-white"
                    }`}
                  >
                    📊 Pipeline Kanban CRM
                    {savedItems.filter(i => i.type === 'brief').length > 0 && (
                      <span className="text-[9px] bg-cyan-950 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-800 font-bold">
                        {savedItems.filter(i => i.type === 'brief').length}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {dashboardView === 'crm' ? (
                <KanbanBoard onNavigateToTab={handleNavigateToTab} />
              ) : (
                <>
                  <div className="space-y-6">

                {/* Quick Stats Grid with modern tech cards - Now accounting for all 6 Module Types! */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {/* Card 1: Social Posts */}
                  <div className="bg-gradient-to-b from-slate-900/40 to-[#030303] border border-white/5 rounded-xl p-4 relative overflow-hidden shadow-[0_0_15px_rgba(255,107,0,0.01)] hover:border-cyan-500/20 transition-all">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-slate-500">
                        <span className="text-[10px] text-cyan-400 font-bold font-mono uppercase tracking-wider">Socials</span>
                        <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                      </div>
                      <p className="text-2xl font-light font-display text-white mt-1">
                        {savedItems.filter(item => item.type === 'social').length}
                      </p>
                      <span className="text-[9px] text-slate-500 font-mono block leading-tight">Branding posts</span>
                    </div>
                  </div>

                  {/* Card 2: Snippets Code */}
                  <div className="bg-gradient-to-b from-slate-900/40 to-[#030303] border border-white/5 rounded-xl p-4 relative overflow-hidden shadow-[0_0_15px_rgba(255,107,0,0.01)] hover:border-cyan-500/20 transition-all">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-slate-500">
                        <span className="text-[10px] text-cyan-400 font-bold font-mono uppercase tracking-wider">Snippets</span>
                        <Code className="h-3.5 w-3.5 text-cyan-400" />
                      </div>
                      <p className="text-2xl font-light font-display text-white mt-1">
                        {savedItems.filter(item => item.type === 'code').length}
                      </p>
                      <span className="text-[9px] text-slate-500 font-mono block leading-tight font-sans">Boîtes à composants</span>
                    </div>
                  </div>

                  {/* Card 3: Copy landing / SEO */}
                  <div className="bg-gradient-to-b from-slate-900/40 to-[#030303] border border-white/5 rounded-xl p-4 relative overflow-hidden shadow-[0_0_15px_rgba(255,107,0,0.01)] hover:border-cyan-500/20 transition-all">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-slate-500">
                        <span className="text-[10px] text-cyan-400 font-bold font-mono uppercase tracking-wider">Rédaction</span>
                        <FileText className="h-3.5 w-3.5 text-cyan-400" />
                      </div>
                      <p className="text-2xl font-light font-display text-white mt-1">
                        {savedItems.filter(item => item.type === 'copy').length}
                      </p>
                      <span className="text-[9px] text-slate-500 font-mono block leading-tight font-sans">Gabarits Copy & SEO</span>
                    </div>
                  </div>

                  {/* Card 4: Assets Visuels */}
                  <div className="bg-gradient-to-b from-slate-900/40 to-[#030303] border border-white/5 rounded-xl p-4 relative overflow-hidden shadow-[0_0_15px_rgba(255,107,0,0.01)] hover:border-cyan-500/20 transition-all">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-slate-500">
                        <span className="text-[10px] text-cyan-400 font-bold font-mono uppercase tracking-wider">Design / SVGs</span>
                        <Palette className="h-3.5 w-3.5 text-cyan-400" />
                      </div>
                      <p className="text-2xl font-light font-display text-white mt-1">
                        {savedItems.filter(item => item.type === 'design').length}
                      </p>
                      <span className="text-[9px] text-slate-500 font-mono block leading-tight font-sans">Moodboards & Icons</span>
                    </div>
                  </div>

                  {/* Card 5: Tunnels ManyChat */}
                  <div className="bg-gradient-to-b from-slate-900/40 to-[#030303] border border-white/5 rounded-xl p-4 relative overflow-hidden shadow-[0_0_15px_rgba(255,107,0,0.01)] hover:border-cyan-500/20 transition-all">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-slate-500">
                        <span className="text-[10px] text-cyan-400 font-bold font-mono uppercase tracking-wider">Tunnels</span>
                        <MessageSquare className="h-3.5 w-3.5 text-cyan-400" />
                      </div>
                      <p className="text-2xl font-light font-display text-white mt-1">
                        {savedItems.filter(item => item.type === 'manychat').length}
                      </p>
                      <span className="text-[9px] text-slate-500 font-mono block leading-tight font-sans">Répondeurs Instants</span>
                    </div>
                  </div>

                  {/* Card 6: Briefs & Devis */}
                  <div className="bg-gradient-to-b from-slate-900/40 to-[#030303] border border-white/5 rounded-xl p-4 relative overflow-hidden shadow-[0_0_15px_rgba(255,107,0,0.01)] hover:border-cyan-500/20 transition-all">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-slate-500">
                        <span className="text-[10px] text-cyan-400 font-bold font-mono uppercase tracking-wider">Briefs UI</span>
                        <Bot className="h-3.5 w-3.5 text-cyan-400" />
                      </div>
                      <p className="text-2xl font-light font-display text-white mt-1">
                        {savedItems.filter(item => item.type === 'brief').length}
                      </p>
                      <span className="text-[9px] text-slate-500 font-mono block leading-tight font-sans">Cadrages & Devis client</span>
                    </div>
                  </div>
                </div>

                {/* Core Modules Explorer Panels */}
                <div className="space-y-6">
                  <h2 className="text-xs uppercase tracking-widest text-slate-500 font-bold font-mono">
                    Explorateur d'Outils / Command Hub
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    
                    {/* Hub Réseaux */}
                    <div className="bg-black/60 border border-white/5 hover:border-cyan-500/20 p-6 rounded-2xl flex flex-col justify-between space-y-4 group transition-all shadow-md">
                      <div className="space-y-2">
                        <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex flex-col items-center justify-center">
                          <Sparkles className="h-5 w-5 text-cyan-400" />
                        </div>
                        <h3 className="text-base font-bold font-display text-white group-hover:text-cyan-400 transition-colors">Personal Branding & Réseaux</h3>
                        <p className="text-slate-400 text-xs leading-relaxed">
                          Assure ta visibilité en solo. Rédige en un instant tes posts d'annonce Linkedin, tes tweets d'acquisition ou suggestions d'Instagram.
                        </p>
                      </div>
                      <button 
                        onClick={() => setActiveTab('social')}
                        className="flex items-center gap-1.5 text-xs text-cyan-400 font-semibold hover:text-cyan-300 font-mono cursor-pointer transition-colors"
                      >
                        Ouvrir le Hub réseaux <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Composants de code */}
                    <div className="bg-black/60 border border-white/5 hover:border-cyan-500/20 p-6 rounded-2xl flex flex-col justify-between space-y-4 group transition-all shadow-md">
                      <div className="space-y-2">
                        <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex flex-col items-center justify-center">
                          <Code className="h-5 w-5 text-cyan-400" />
                        </div>
                        <h3 className="text-base font-bold font-display text-white group-hover:text-cyan-400 transition-colors">Composants de Code & Snippets</h3>
                        <p className="text-slate-400 text-xs leading-relaxed">
                          Évite d'écrire deux fois le même composant. Demande à l'assistant de créer des switches animés en Tailwind, des scripts PHP sécurisés ou des migrations SQL.
                        </p>
                      </div>
                      <button 
                        onClick={() => setActiveTab('code')}
                        className="flex items-center gap-1.5 text-xs text-cyan-400 font-semibold hover:text-cyan-300 font-mono cursor-pointer transition-colors"
                      >
                        Ouvrir le générateur de code <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Assistant Copywriting */}
                    <div className="bg-black/60 border border-white/5 hover:border-cyan-500/20 p-6 rounded-2xl flex flex-col justify-between space-y-4 group transition-all shadow-md">
                      <div className="space-y-2">
                        <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex flex-col items-center justify-center">
                          <FileText className="h-5 w-5 text-cyan-400" />
                        </div>
                        <h3 className="text-base font-bold font-display text-white group-hover:text-cyan-400 transition-colors">Copywriting Landing & SEO</h3>
                        <p className="text-slate-400 text-xs leading-relaxed">
                          Automatise la verbalisation de tes offres. Crée les grands titres de Landing, des descriptions SEO, des mots-clés performants et des hooks d'acquisition en un clic.
                        </p>
                      </div>
                      <button 
                        onClick={() => setActiveTab('copy')}
                        className="flex items-center gap-1.5 text-xs text-cyan-400 font-semibold hover:text-cyan-300 font-mono cursor-pointer transition-colors"
                      >
                        Ouvrir l'assistant rédactionnel <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Moodboard & SVG builder */}
                    <div className="bg-black/60 border border-white/5 hover:border-cyan-500/20 p-6 rounded-2xl flex flex-col justify-between space-y-4 group transition-all shadow-md">
                      <div className="space-y-2">
                        <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex flex-col items-center justify-center">
                          <Palette className="h-5 w-5 text-cyan-400" />
                        </div>
                        <h3 className="text-base font-bold font-display text-white group-hover:text-cyan-400 transition-colors">Moodboard & Assets SVG</h3>
                        <p className="text-slate-400 text-xs leading-relaxed">
                          Structure l'identité esthétique de tes projets en ligne. Trouve des inspirations, des codes couleurs harmonisés utilisables, et télécharge un icône SVG vectoriel brut.
                        </p>
                      </div>
                      <button 
                        onClick={() => setActiveTab('design')}
                        className="flex items-center gap-1.5 text-xs text-cyan-400 font-semibold hover:text-cyan-300 font-mono cursor-pointer transition-colors"
                      >
                        Ouvrir l'atelier design <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Tunnel ManyChat */}
                    <div className="bg-black/60 border border-white/5 hover:border-cyan-500/20 p-6 rounded-2xl flex flex-col justify-between space-y-4 group transition-all shadow-md">
                      <div className="space-y-2">
                        <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex flex-col items-center justify-center">
                          <MessageSquare className="h-5 w-5 text-cyan-400" />
                        </div>
                        <h3 className="text-base font-bold font-display text-white group-hover:text-cyan-400 transition-colors">Tunnels de Réponses ManyChat + IA</h3>
                        <p className="text-slate-400 text-xs leading-relaxed">
                          Concocte de formidables tunnels automatisés connectés à Instagram. Écris tes prompts de comportement, simule les réponses en temps réel à l'aide de l'IA et exporte le JSON.
                        </p>
                      </div>
                      <button 
                        onClick={() => setActiveTab('manychat')}
                        className="flex items-center gap-1.5 text-xs text-cyan-400 font-semibold hover:text-cyan-300 font-mono cursor-pointer transition-colors"
                      >
                        Créer un tunnel ManyChat <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Brief Agent */}
                    <div className="bg-black/60 border border-white/5 hover:border-cyan-500/20 p-6 rounded-2xl flex flex-col justify-between space-y-4 group transition-all shadow-md">
                      <div className="space-y-2">
                        <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex flex-col items-center justify-center">
                          <Bot className="h-5 w-5 text-cyan-400 font-mono" />
                        </div>
                        <h3 className="text-base font-bold font-display text-white group-hover:text-cyan-400 transition-colors font-sans">Cadrage Client & Devis Chiffré</h3>
                        <p className="text-slate-400 text-xs leading-relaxed font-sans">
                          Évaluez les besoins d'un prospect de manière ludique et conversationnelle. Générez en une seconde le PRD, le cahier des charges et un devis interactif 100% personnalisable.
                        </p>
                      </div>
                      <button 
                        onClick={() => setActiveTab('brief')}
                        className="flex items-center gap-1.5 text-xs text-cyan-400 font-semibold hover:text-cyan-300 font-mono cursor-pointer transition-colors"
                      >
                        Lancer un cadrage client <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Générateur de Projet */}
                    <div className="bg-[#110e0b] border border-orange-500/25 hover:border-orange-500/50 p-6 rounded-2xl flex flex-col justify-between space-y-4 group transition-all shadow-md">
                      <div className="space-y-2">
                        <div className="h-10 w-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex flex-col items-center justify-center">
                          <Cpu className="h-5 w-5 text-orange-400" />
                        </div>
                        <h3 className="text-base font-bold font-display text-white group-hover:text-orange-400 transition-colors uppercase tracking-tight">Générateur de Projet</h3>
                        <p className="text-slate-400 text-xs leading-relaxed font-sans font-sans">
                          Transforme un cahier des charges ou un brief Kanban en code prêt pour la production. Génère le schéma SQL Supabase, les composants UI React, et la logique d'API.
                        </p>
                      </div>
                      <button 
                        onClick={() => setActiveTab('generator')}
                        className="flex items-center gap-1.5 text-xs text-orange-400 font-semibold hover:text-orange-300 font-mono cursor-pointer transition-colors"
                      >
                        Bâtir un projet NoCode/Tech <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>

                  </div>
                </div>

                {/* Live Compilation of Activity & Workspace Efficiency */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
                  {/* Recent items Feed list */}
                  <div className="lg:col-span-2 bg-[#090909]/60 border border-white/5 rounded-2xl p-5 space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-white/5">
                      <h3 className="text-xs uppercase tracking-widest text-white font-bold font-mono flex items-center gap-2">
                        <Heart className="h-4 w-4 text-cyan-400 animate-pulse" />
                        Dernières Créations Sauvées ({savedItems.length})
                      </h3>
                      {savedItems.length > 0 && (
                        <button
                          onClick={() => setActiveTab('saved')}
                          className="text-[10px] font-mono text-cyan-400 hover:underline cursor-pointer"
                        >
                          Tout voir
                        </button>
                      )}
                    </div>

                    {savedItems.length === 0 ? (
                      <div className="py-8 text-center text-slate-500 space-y-2">
                        <p className="text-xs italic leading-tight">Aucun livrable n'est encore enregistré dans la bibliothèque.</p>
                        <p className="text-[10px]">Utilisez les modules ci-dessus puis cliquez sur "Sauvegarder l'asset" pour compiler vos premières données.</p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {savedItems.slice(0, 3).map((item) => {
                          let labelColor = "bg-cyan-950 border-cyan-800 text-cyan-400";
                          if (item.type === 'social') labelColor = "bg-green-950/40 border-green-800/30 text-green-400";
                          if (item.type === 'code') labelColor = "bg-amber-950/40 border-amber-800/30 text-amber-400";
                          if (item.type === 'copy') labelColor = "bg-blue-950/40 border-blue-800/30 text-blue-400";
                          if (item.type === 'design') labelColor = "bg-purple-950/40 border-purple-800/30 text-purple-400";
                          if (item.type === 'manychat') labelColor = "bg-rose-950/40 border-rose-800/30 text-rose-400";
                          if (item.type === 'brief') labelColor = "bg-cyan-950/40 border-cyan-800/30 text-cyan-400";

                          return (
                            <div key={item.id} className="flex items-center justify-between p-3.5 bg-black/40 border border-white/5 hover:border-white/10 rounded-xl transition-all">
                              <div className="min-w-0 flex-1 pr-3">
                                <span className={`text-[8px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border ${labelColor} inline-block mb-1`}>
                                  {item.type}
                                </span>
                                <h4 className="text-xs font-semibold text-white truncate leading-snug">{item.title}</h4>
                                <span className="text-[9px] font-mono text-slate-500 block mt-0.5">
                                  Sauvegardé le {new Date(item.createdAt).toLocaleDateString("fr-FR")} à {new Date(item.createdAt).toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <button
                                onClick={() => {
                                  setActiveTab('saved');
                                }}
                                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-cyan-500 hover:text-black hover:border-cyan-500 font-mono text-[10px] transition-all cursor-pointer select-none active:scale-95 duration-100 shrink-0"
                              >
                                Ouvrir
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Impact Statistics & Efficiency Indicators */}
                  <div className="bg-[#090909]/60 border border-white/5 rounded-2xl p-5 flex flex-col justify-between space-y-4">
                    <div className="space-y-2 pb-2 border-b border-white/5">
                      <h3 className="text-xs uppercase tracking-widest text-white font-bold font-mono">
                        ⚡ Métriques d'Augmentation
                      </h3>
                      <p className="text-[10px] text-slate-500 font-mono leading-none">Indice de performance du Digital Artisan</p>
                    </div>

                    <div className="space-y-3 font-mono text-xs">
                      <div className="flex justify-between items-center py-1">
                        <span className="text-slate-400">Temps ingénierie sauvé :</span>
                        <span className="text-cyan-400 font-bold">
                          {savedItems.filter(item => item.type === 'code').length * 45 + savedItems.filter(item => item.type === 'brief').length * 150} min
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-slate-400">Drafts marketing :</span>
                        <span className="text-green-400 font-bold">
                          {savedItems.filter(item => item.type === 'social').length * 3} posts
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-slate-400">Landing Pages copywritées :</span>
                        <span className="text-blue-400 font-bold">
                          {savedItems.filter(item => item.type === 'copy').length} fiches
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-slate-400">Tunnels automatisés :</span>
                        <span className="text-rose-400 font-bold">
                          {savedItems.filter(item => item.type === 'manychat').length} actif(s)
                        </span>
                      </div>
                    </div>

                    {(() => {
                      const revenue = calculateCRMRevenue();
                      return (
                        <div className="bg-cyan-950/15 border border-cyan-500/10 px-3.5 py-2.5 rounded-xl space-y-2">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold font-mono text-cyan-400 uppercase tracking-wide">
                            <span className="h-1.5 w-1.5 bg-cyan-400 rounded-full animate-ping shrink-0" />
                            Performances CRM & Chiffre d'Affaire
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                            <div className="space-y-0.5">
                              <span className="text-slate-500 block text-[9px]">GAGNÉ / SIGNÉ :</span>
                              <span className="text-emerald-400 font-bold font-sans text-xs">{revenue.won.toLocaleString('fr-FR')} € HT</span>
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-slate-500 block text-[9px]">EN DISCUSSION :</span>
                              <span className="text-blue-400 font-bold font-sans text-xs">{revenue.sent.toLocaleString('fr-FR')} € HT</span>
                            </div>
                          </div>
                          <div className="pt-2 border-t border-white/5 flex justify-between items-center text-[10px] font-mono">
                            <span className="text-slate-400 font-bold">TOTAL POTENTIEL :</span>
                            <span className="text-cyan-300 font-extrabold text-[11px]">{revenue.total.toLocaleString('fr-FR')} € HT</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Quick guidelines and workflow card */}
              <div className="bg-[#0c0c0c]/80 p-6 border border-white/5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 mt-8">
                <div className="space-y-1">
                  <h4 className="text-white font-medium text-sm flex items-center gap-1.5 font-display uppercase tracking-wider">
                    <BookOpen className="h-4 w-4 text-cyan-400" /> À PROPOS DE LA PERSISTANCE LOCALE
                  </h4>
                  <p className="text-slate-500 text-xs leading-relaxed max-w-xl">
                    Vos créations et assets générés au sein des modules sont sauvegardés sous forme d'historique dans votre mémoire navigateur (localStorage). Vous ne perdez aucun texte de branding ou snippet de code d'une session à l'autre.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('saved')}
                  className="bg-white text-black hover:bg-cyan-400 py-2.5 px-5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(34,211,238,0.2)]"
                >
                  Accéder à la Bibliothèque
                </button>
              </div>

                  </>
                )}

            </div>
          ) : (
            /* --- MODULAR COMPONENTS VIEW --- */
            <div className="flex-1">
              {activeTab === 'brand' && <BrandHub brandIdentity={brandIdentity} onSave={handleSaveBrandIdentity} />}
              {activeTab === 'social' && <SocialHub onSave={handleSaveItem} brandIdentity={brandIdentity} />}
              {activeTab === 'code' && <CodeGenerator onSave={handleSaveItem} />}
              {activeTab === 'copy' && <CopySEO onSave={handleSaveItem} />}
              {activeTab === 'design' && <DesignAssets onSave={handleSaveItem} />}
              {activeTab === 'manychat' && <ManyChatTunneler onSave={handleSaveItem} />}
              {activeTab === 'brief' && <BriefAgent onSave={handleSaveItem} />}
              {activeTab === 'pipeline' && <KanbanBoard onNavigateToTab={handleNavigateToTab} />}
              {activeTab === 'commercial-agent' && <CommercialAgent onSaveBrief={handleSaveItem} onNavigateToTab={handleNavigateToTab} />}
              {activeTab === 'generator' && <ProjectGenerator onSave={handleSaveItem} />}
              {activeTab === 'saved' && (
                <SavedLibrary 
                  items={savedItems} 
                  onDelete={handleDeleteItem} 
                  onNavigateToTab={handleNavigateToTab} 
                />
              )}
            </div>
          )}

        </div>

        {/* Global Immersive Footer Context Bar */}
        <footer className="mt-12 flex flex-col sm:flex-row justify-between items-center gap-3 border-t border-white/5 pt-4 text-[10px] font-mono text-slate-600 w-full select-none">
          <div className="flex gap-6">
            <span>NODE_ID: 0x8FA2</span>
            <span>LATENCY: 42ms</span>
            <span>STORAGE: 1.2TB / 5.0TB</span>
          </div>
          <div className="flex gap-4">
            <span className="text-cyan-900 uppercase font-bold tracking-wider">System Heartbeat: Stable</span>
            <span className="text-slate-800">|</span>
            <span>© 2026 HANDCODE LABS</span>
          </div>
        </footer>

      </main>
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
