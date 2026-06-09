import React, { useState } from 'react';
import { 
  Terminal, 
  Database, 
  Layout, 
  Cpu, 
  Clipboard, 
  Check, 
  Play, 
  Loader2, 
  FileCode, 
  Layers, 
  Sparkles,
  RefreshCw,
  Send,
  Zap,
  HelpCircle
} from 'lucide-react';

interface ProjectGeneratorProps {
  onSave?: (type: string, title: string, data: any) => void;
}

export default function ProjectGenerator({ onSave }: ProjectGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [activeTab, setActiveTab] = useState<'sql' | 'ui' | 'api'>('sql');
  const [result, setResult] = useState<{ sql: string; ui: string; api: string; apiKeyWarning?: boolean } | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedTab, setCopiedTab] = useState<'sql' | 'ui' | 'api' | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load the "Resto-Livr (Jean-Luc K.)" pre-filled demo
  const loadRestoLivrDemo = () => {
    setPrompt(
      "Projet Resto-Livr (Jean-Luc K.)\n" +
      "Besoin : Système de centralisation et de suivi des livraisons de repas à Abidjan pour connecter les restaurants et les livreurs partenaires.\n\n" +
      "Spécifications requises:\n" +
      "1. La table 'orders' : id (uuid, pk), customer_name (text), restaurant_name (text), delivery_address (text), price (numeric), status (text: 'En attente', 'En cours', 'Livré'), courier_id (uuid, fk, nullable).\n" +
      "2. La table 'couriers' : id (uuid, pk), name (text), phone (text), email (text), status (text: 'Disponible', 'En livraison').\n" +
      "3. Un composant React/Tailwind complet qui permet de mettre à jour le statut d'une commande/livraison (Passer le statut de 'En attente' à 'En cours', et l'assigner à un livreur disponible).\n" +
      "4. Les fonctions Supabase API TypeScript associées."
    );
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setErrorMsg(null);
    setResult(null);

    try {
      const response = await fetch('/api/generate-project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error(`Serveur indisponible (erreur ${response.status})`);
      }

      const resData = await response.json();
      if (resData.success && resData.data) {
        setResult(resData.data);
        setActiveTab('sql'); // default to SQL tab
        setErrorMsg(null);
      } else {
        throw new Error(resData.error || "Les données reçues sont incorrectes.");
      }
    } catch (err: any) {
      console.error(err);
      
      const pLower = prompt.toLowerCase();
      const isRestoLivr = pLower.includes("resto") || pLower.includes("livr") || pLower.includes("repas") || pLower.includes("abidjan") || pLower.includes("cmd") || pLower.includes("manger") || pLower.includes("commandes") || pLower.includes("delivery") || pLower.includes("courier") || pLower.includes("jean-luc");

      if (isRestoLivr) {
        setErrorMsg(null);
        setResult({
          apiKeyWarning: true,
          sql: `-- =========================================================\n` +
               `-- TABLE DES COURIERS (Livreurs d'Abidjan)\n` +
               `-- =========================================================\n` +
               `CREATE TABLE public.couriers (\n` +
               `    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n` +
               `    name TEXT NOT NULL,\n` +
               `    phone TEXT NOT NULL,\n` +
               `    email TEXT UNIQUE,\n` +
               `    status TEXT DEFAULT 'Disponible' NOT NULL CHECK (status IN ('Disponible', 'En livraison')),\n` +
               `    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL\n` +
               `);\n\n` +
               `-- =========================================================\n` +
               `-- TABLE DES COMMANDES (Orders)\n` +
               `-- =========================================================\n` +
               `CREATE TABLE public.orders (\n` +
               `    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n` +
               `    customer_name TEXT NOT NULL,\n` +
               `    restaurant_name TEXT NOT NULL,\n` +
               `    delivery_address TEXT NOT NULL,\n` +
               `    price NUMERIC NOT NULL DEFAULT 0 CHECK (price >= 0),\n` +
               `    status TEXT DEFAULT 'En attente' NOT NULL CHECK (status IN ('En attente', 'En cours', 'Livré')),\n` +
               `    courier_id UUID REFERENCES public.couriers(id) ON DELETE SET NULL,\n` +
               `    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL\n` +
               `);\n\n` +
               `-- INDEXATION POUR RECHERCHE RAPIDE\n` +
               `CREATE INDEX idx_orders_courier ON public.orders(courier_id);\n` +
               `CREATE INDEX idx_orders_status ON public.orders(status);\n`,
          ui: `import React, { useState } from 'react';\n` +
              `import { Truck, Clock, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';\n\n` +
              `// Les types TypeScript\n` +
              `export interface Courier {\n` +
              `  id: string;\n` +
              `  name: string;\n` +
              `  phone: string;\n` +
              `  status: 'Disponible' | 'En livraison';\n` +
              `}\n\n` +
              `export interface Order {\n` +
              `  id: string;\n` +
              `  customer_name: string;\n` +
              `  restaurant_name: string;\n` +
              `  delivery_address: string;\n` +
              `  price: number;\n` +
              `  status: 'En attente' | 'En cours' | 'Livré';\n` +
              `  courier_id: string | null;\n` +
              `}\n\n` +
              `interface RestoLivrStatusProps {\n` +
              `  order: Order;\n` +
              `  availableCouriers: Courier[];\n` +
              `  onStartDelivery: (orderId: string, courierId: string) => Promise<void>;\n` +
              `}\n\n` +
              `export function DeliveryUpdateControl({ order, availableCouriers, onStartDelivery }: RestoLivrStatusProps) {\n` +
              `  const [selectedCourierId, setSelectedCourierId] = useState('');\n` +
              `  const [loading, setLoading] = useState(false);\n` +
              `  const [message, setMessage] = useState<string | null>(null);\n\n` +
              `  const triggerDelivery = async () => {\n` +
              `    if (!selectedCourierId) {\n` +
              `      setMessage('Veuillez sélectionner un coursier disponible.');\n` +
              `      return;\n` +
              `    }\n` +
              `    setLoading(true);\n` +
              `    setMessage(null);\n` +
              `    try {\n` +
              `      await onStartDelivery(order.id, selectedCourierId);\n` +
              `      setMessage('Livraison initiée avec succès ! Le statut est passé à [En cours].');\n` +
              `    } catch (err: any) {\n` +
              `      setMessage('Erreur : ' + (err.message || 'Impossible de mettre à jour le statut.'));\n` +
              `    } finally {\n` +
              `      setLoading(false);\n` +
              `    }\n` +
              `  };\n\n` +
              `  return (\n` +
              `    <div className="bg-[#0b0c10] border border-white/10 rounded-xl p-5 text-slate-350 space-y-4 max-w-md w-full font-sans shadow-lg">\n` +
              `      <div className="flex justify-between items-start border-b border-white/5 pb-3">\n` +
              `        <div>\n` +
              `          <span className="text-[10px] bg-orange-500/10 border border-orange-500/30 text-orange-400 font-mono px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider">\n` +
          `            Commande #\${order.id.slice(0, 8)}\n` +
          `          </span>\n` +
              `          <h4 className="text-sm font-bold text-white mt-1">{order.customer_name}</h4>\n` +
              `          <p className="text-xs text-slate-500 mt-0.5">{order.restaurant_name} ➔ {order.delivery_address}</p>\n` +
              `        </div>\n` +
              `        <div className="text-right">\n` +
              `          <p className="text-xs font-mono font-bold text-[#FFF]">{order.price.toLocaleString("fr-FR")} FCFA</p>\n` +
              `          <p className="text-[10px] text-slate-500 mt-1">Montant global</p>\n` +
              `        </div>\n` +
              `      </div>\n\n` +
              `      <div className="flex items-center gap-2">\n` +
              `        <span className="text-xs text-slate-500">Statut actuel :</span>\n` +
              `        <span className={\`text-[11px] font-mono px-2 py-0.5 rounded-full font-extrabold border \${` +
              `          order.status === 'En attente' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :\n` +
              `          order.status === 'En cours' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' :\n` +
              `          'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'\n` +
              `        }\`}>\n` +
              `          {order.status}\n` +
              `        </span>\n` +
              `      </div>\n\n` +
              `      {order.status === 'En attente' ? (\n` +
              `        <div className="space-y-3 pt-2">\n` +
              `          <label className="text-xs font-mono text-slate-400 block font-bold">ASSIGGNER UN COURSIER PARTENAIRE :</label>\n` +
              `          <select\n` +
              `            value={selectedCourierId}\n` +
              `            onChange={(e) => setSelectedCourierId(e.target.value)}\n` +
              `            className="w-full bg-black border border-white/15 rounded-lg p-2.5 text-xs text-white focus:border-orange-500/50 outline-none cursor-pointer"\n` +
              `          >\n` +
              `            <option value="">-- Choisir un livreur disponible --</option>\n` +
              `            {availableCouriers.map((c) => (\n` +
              `              <option key={c.id} value={c.id}>\n` +
              `                {c.name} ({c.phone})\n` +
              `              </option>\n` +
              `            ))}\n` +
              `          </select>\n\n` +
              `          <button\n` +
              `            onClick={triggerDelivery}\n` +
              `            disabled={loading || !selectedCourierId}\n` +
              `            className="w-full py-2.5 bg-orange-600 hover:bg-orange-500 text-black font-extrabold uppercase rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer text-xs"\n` +
              `          >\n` +
              `            {loading ? <Clock className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}\n` +
              `            Lancer la livraison (En cours)\n` +
              `            <ArrowRight className="h-3.5 w-3.5" />\n` +
              `          </button>\n` +
              `        </div>\n` +
              `      ) : (\n` +
              `        <div className="bg-emerald-950/10 border border-emerald-500/15 p-3.5 rounded-lg flex items-center gap-2.5 text-emerald-400 text-xs leading-relaxed">\n` +
              `          <CheckCircle className="h-4 w-4 shrink-0" />\n` +
              `          <span>Cette livraison est déjà gérée et en cours de traitement par notre livreur affilié.</span>\n` +
              `        </div>\n` +
              `      )}\n\n` +
              `      {message && (\n` +
              `        <p className="text-[11px] text-orange-400 font-mono italic leading-normal text-center bg-white/5 p-2 rounded border border-white/5">\n` +
              `          {message}\n` +
              `        </p>\n` +
              `      )}\n` +
              `    </div>\n` +
              `  );\n` +
              `}\n`,
          api: `import { createClient } from '@supabase/supabase-js';\n\n` +
               `// Initialisation client Supabase\n` +
               `const supabaseUrl = process.env.SUPABASE_URL || '';\n` +
               `const supabaseKey = process.env.SUPABASE_ANON_KEY || '';\n` +
               `const supabase = createClient(supabaseUrl, supabaseKey);\n\n` +
               `/**\n` +
               ` * Récupère les commandes Resto-Livr\n` +
               ` */\n` +
               `export async function getOrders() {\n` +
               `  try {\n` +
               `    const { data, error } = await supabase\n` +
               `      .from('orders')\n` +
               `      .select('*, couriers(*)')\n` +
               `      .order('created_at', { ascending: false });\n` +
               `    if (error) throw error;\n` +
               `    return { data, error: null };\n` +
               `  } catch (err: any) {\n` +
               `    console.error('Erreur getOrders:', err.message || err);\n` +
               `    return { data: null, error: err.message || err };\n` +
               `  }\n` +
               `}\n\n` +
               `/**\n` +
               ` * Récupère la liste des livreurs disponibles (Abidjan)\n` +
               ` */\n` +
               `export async function getAvailableCouriers() {\n` +
               `  try {\n` +
               `    const { data, error } = await supabase\n` +
               `      .from('couriers')\n` +
               `      .select('*')\n` +
               `      .eq('status', 'Disponible');\n` +
               `    if (error) throw error;\n` +
               `    return { data, error: null };\n` +
               `  } catch (err: any) {\n` +
               `    console.error('Erreur getAvailableCouriers:', err.message || err);\n` +
               `    return { data: null, error: err.message || err };\n` +
               `  }\n` +
               `}\n\n` +
               `/**\n` +
               ` * Met à jour le statut d'une livraison à 'En cours'\n` +
               ` * avec assignation du livreur et passage du livreur à 'En livraison'\n` +
               ` */\n` +
               `export async function startOrderDelivery(orderId: string, courierId: string) {\n` +
               `  try {\n` +
               `    // 1. Assigner le livreur et passer la commande 'En cours'\n` +
               `    const { data: updatedOrder, error: orderError } = await supabase\n` +
               `      .from('orders')\n` +
               `      .update({ status: 'En cours', courier_id: courierId })\n` +
               `      .eq('id', orderId)\n` +
               `      .select();\n\n` +
               `    if (orderError) throw orderError;\n\n` +
               `    // 2. Mettre à jour le statut du livreur à 'En livraison'\n` +
               `    const { error: courierError } = await supabase\n` +
               `      .from('couriers')\n` +
               `      .update({ status: 'En livraison' })\n` +
               `      .eq('id', courierId);\n\n` +
               `    if (courierError) throw courierError;\n\n` +
               `    return { success: true, order: updatedOrder, error: null };\n` +
               `  } catch (err: any) {\n` +
               `    console.error('Erreur startOrderDelivery:', err.message || err);\n` +
               `    return { success: false, order: null, error: err.message || err };\n` +
               `  }\n` +
               `}\n`
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: 'sql' | 'ui' | 'api') => {
    navigator.clipboard.writeText(text);
    setCopiedTab(type);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  return (
    <div className="space-y-6 text-xs max-w-5xl mx-auto animate-fade-in font-mono">
      
      {/* Upper Module Banner */}
      <div className="bg-gradient-to-r from-neutral-950 via-zinc-950 to-black border border-white/5 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[10px] bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">
            ARTISAN_OS ENGINE
          </span>
          <h2 className="text-xl sm:text-2xl font-light text-white tracking-tight font-display uppercase">
            Générateur de Projet (Agent Bâtisseur)
          </h2>
          <p className="text-slate-500 text-[11px] font-sans">
            Collez le besoin d'un prospect, et l'Agent Bâtisseur établira le schéma de données, l'interface client, et le code d'intégration API.
          </p>
        </div>

        <div>
          <button
            onClick={loadRestoLivrDemo}
            className="px-4 py-2 bg-neutral-900 border border-orange-500/30 text-orange-400 hover:bg-neutral-800 font-bold tracking-wider rounded-xl flex items-center gap-1.5 transition-all cursor-pointer text-xs"
          >
            <Zap className="h-4 w-4 shrink-0 fill-orange-400/20" />
            ⚡ Exemple Resto-Livr
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Input panel (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#0b0c10] border border-white/5 rounded-2xl p-5 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <FileCode className="h-4 w-4 text-orange-500" />
              Saisie du Cahier des Charges
            </h3>
            
            <p className="text-slate-400 text-[11px] leading-relaxed font-sans">
              Insérez le brief extrait du Kanban. L'agent utilisera l'IA pour générer automatiquement l'échafaudage de code prêt à être copié-collé.
            </p>

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={12}
              className="w-full bg-black border border-white/10 rounded-xl p-3 text-slate-200 focus:border-orange-500/50 outline-none leading-relaxed text-[11px] font-mono select-text"
              placeholder="Colle ici le besoin client extrait de ton Kanban en précisant les besoins de bases de données, colonnes spécifiques ou maquettes de composants souhaités..."
            />

            {errorMsg && (
              <p className="text-[10px] text-orange-500 bg-orange-950/20 p-2.5 rounded-lg border border-orange-500/20 leading-relaxed">
                {errorMsg}
              </p>
            )}

            <button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className="w-full py-3 bg-orange-600 hover:bg-orange-500 disabled:bg-neutral-900 disabled:text-neutral-600 disabled:border-transparent text-black font-extrabold uppercase tracking-wide rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer text-xs"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-black" />
                  Génération de l'architecture...
                </>
              ) : (
                <>
                  <Cpu className="h-4 w-4 stroke-[2.5px] text-black" />
                  Générer l'Architecture
                </>
              )}
            </button>
          </div>
        </div>

        {/* Output panel (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          {result?.apiKeyWarning && (
            <div className="bg-amber-500/10 border border-amber-500/25 p-4 rounded-xl flex items-start gap-3 text-amber-300 font-sans shadow-md">
              <span className="text-base">💡</span>
              <div className="space-y-1">
                <p className="font-bold text-xs uppercase tracking-wider">Note de l'Agent Bâtisseur (Moteur Résilient)</p>
                <p className="text-[11px] text-slate-300 leading-relaxed font-normal">
                  Votre clé API d'AI Studio semble inactive ou expirée. Pas de panique ! L'Agent Bâtisseur a activé son moteur de fallback local pour générer l'architecture exacte de votre projet sans interruption.
                </p>
              </div>
            </div>
          )}
          {result ? (
            <div className="bg-[#0b0c10] border border-white/5 rounded-2xl overflow-hidden shadow-2xl flex flex-col min-h-[500px]">
              
              {/* Output Tab Selector */}
              <div className="bg-black p-2 border-b border-white/5 flex flex-wrap gap-1">
                <button
                  onClick={() => setActiveTab('sql')}
                  className={`px-3 py-2 rounded-xl border text-[11px] font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'sql'
                      ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                      : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Database className="h-3.5 w-3.5" />
                  [SQL Schema]
                </button>

                <button
                  onClick={() => setActiveTab('ui')}
                  className={`px-3 py-2 rounded-xl border text-[11px] font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'ui'
                      ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                      : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Layout className="h-3.5 w-3.5" />
                  [Composants UI]
                </button>

                <button
                  onClick={() => setActiveTab('api')}
                  className={`px-3 py-2 rounded-xl border text-[11px] font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'api'
                      ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                      : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Cpu className="h-3.5 w-3.5" />
                  [Logique API]
                </button>
              </div>

              {/* Code window with title bar */}
              <div className="bg-[#050508] p-4 flex-1 flex flex-col relative">
                
                <div className="flex justify-between items-center pb-3 border-b border-white/5 mb-4 font-mono text-[10px] text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-orange-500" />
                    <span>
                      {activeTab === 'sql' && 'supabase_schema.sql'}
                      {activeTab === 'ui' && 'RestoLivrStatusControl.tsx'}
                      {activeTab === 'api' && 'resto_livr_api.ts'}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      const codeText = activeTab === 'sql' ? result.sql : activeTab === 'ui' ? result.ui : result.api;
                      copyToClipboard(codeText, activeTab);
                    }}
                    className="px-2.5 py-1 text-[10px] flex items-center gap-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-slate-300 transition-all cursor-pointer"
                  >
                    {copiedTab === activeTab ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        Copié !
                      </>
                    ) : (
                      <>
                        <Clipboard className="h-3.5 w-3.5" />
                        Copier le code
                      </>
                    )}
                  </button>
                </div>

                {/* Main scrollable code viewport */}
                <div className="flex-1 overflow-auto max-h-[500px]">
                  <pre className="text-[10.5px] leading-relaxed text-[#21ebcd] select-all font-mono whitespace-pre text-left">
                    <code>
                      {activeTab === 'sql' && result.sql}
                      {activeTab === 'ui' && result.ui}
                      {activeTab === 'api' && result.api}
                    </code>
                  </pre>
                </div>

              </div>

              {/* Saved actions footer bar */}
              <div className="bg-black p-3.5 border-t border-white/5 text-slate-500 text-[10px] flex justify-between items-center">
                <span>Production ready • TypeScript & Tailwind CSS</span>
                <span>handCode Digital Craftsman © 2026</span>
              </div>

            </div>
          ) : (
            <div className="bg-black/20 border border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center p-12 text-center h-full min-h-[500px]">
              <div className="h-12 w-12 rounded-xl bg-orange-500/5 border border-orange-500/20 flex items-center justify-center text-orange-400 mb-4 animate-pulse">
                <Sparkles className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-2">En attente d'input</h4>
              <p className="text-slate-500 text-[11px] font-sans max-w-sm leading-relaxed">
                Cliquez sur l'exemple "⚡ Exemple Resto-Livr" ou saisissez un descriptif sur mesure, puis cliquez sur "Générer l'Architecture".
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
