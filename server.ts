import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

// Lazily initialized Gemini AI Client
let aiClient: GoogleGenAI | null = null;

// Lazily initialized Supabase Client
let supabaseClient: any = null;

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || url.includes("your-project") || key.includes("your-anon")) {
    return null;
  }
  if (!supabaseClient) {
    try {
      supabaseClient = createClient(url, key);
    } catch (e) {
      console.error("Failed to initialize Supabase client:", e);
      return null;
    }
  }
  return supabaseClient;
}

// In-memory CRM leads fallback store if Supabase is not active/configured
let inMemoryLeads: any[] = [
  {
    id: "seed-jean-luc",
    name: "Jean-Luc K.",
    company: "Abidjan Resto-Livr",
    status: "À revoir",
    budget: 800000,
    description: "Système intelligent de centralisation automatique des commandes de repas arrivant par WhatsApp à Abidjan, avec routage vers une base de données d'exploitation et alertes livreurs.",
    createdAt: new Date().toISOString()
  },
  {
    id: "demo-marie-noelle",
    name: "Marie-Noëlle A.",
    company: "Kira Cosmetics Int.",
    status: "En Closing",
    budget: 1550000,
    description: "Synchronisation d'inventaire de produits de beauté en temps réel sur 4 points de vente physiques à Lomé et e-commerce. Assistant IA WhatsApp relié pour automatisation des commandes.",
    createdAt: new Date(Date.now() - 43200000).toISOString()
  },
  {
    id: "demo-salim-d",
    name: "Salim D.",
    company: "Dakar Tech Logistics",
    status: "Envoi Client",
    budget: 2400000,
    description: "Automatisation de dispatch logistique intelligent avec affectation dynamique des ordres de livraisons par rapport aux localisations géographiques.",
    createdAt: new Date(Date.now() - 172800000).toISOString()
  }
];


function parseGeminiJson(text: string | undefined): any {
  if (!text) return {};
  let cleaned = text.trim();
  
  // Supprimer les blocs de code markdown si présents
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```[a-zA-Z]*\n?/, "");
    cleaned = cleaned.replace(/\n?```$/, "");
    cleaned = cleaned.trim();
  }
  
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("Échec de l'analyse brute du JSON:", cleaned, err);
    // Tenter d'extraire la première et dernière accolade si nécessaire
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
      } catch (nestedErr) {
        console.error("Échec de la récupération imbriquée du JSON:", nestedErr);
      }
    }
    throw err;
  }
}

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === "" || apiKey === "undefined" || apiKey === "null" || apiKey.includes("MY_GEMINI_API_KEY")) {
      throw new Error("GEMINI_API_KEY n'est pas configuré. Veuillez ajouter votre clé API Gemini réelle dans l'onglet des Secrets (Settings) d'AI Studio pour débloquer les fonctionnalités IA.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey.trim(),
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

async function generateContentWithRetry(params: any, maxRetries = 3): Promise<any> {
  const client = getGeminiClient();
  let delay = 1000;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await client.models.generateContent(params);
      return response;
    } catch (err: any) {
      console.warn(`Attempt ${attempt} of Gemini API call failed:`, err.message || err);
      
      const errString = typeof err === "string" ? err : (err?.message || err?.error?.message || JSON.stringify(err) || "");
      const isTransient = 
        errString.includes("503") || 
        errString.includes("500") || 
        errString.includes("high demand") || 
        errString.includes("temporary") || 
        errString.includes("UNAVAILABLE") ||
        err?.status === 503 ||
        err?.status === 500 ||
        err?.code === 503 ||
        err?.code === 500 ||
        err?.error?.code === 503 ||
        err?.error?.code === 500 ||
        err?.error?.status === "UNAVAILABLE";

      // Instant Fallback on first transient overload to keep response times short and avoid UX errors
      if (isTransient && params.model === 'gemini-3.5-flash') {
        console.warn(`Attempt ${attempt} hit transient model overload/503. Instantly triggering fallback to gemini-3.1-flash-lite...`);
        try {
          const fallbackResponse = await client.models.generateContent({
            ...params,
            model: "gemini-3.1-flash-lite"
          });
          console.log("Instant fallback to gemini-3.1-flash-lite was successful!");
          return fallbackResponse;
        } catch (fallbackErr: any) {
          console.error("Instant fallback to gemini-3.1-flash-lite also failed, scaling to retry loop:", fallbackErr?.message || fallbackErr);
        }
      }

      if (attempt === maxRetries) {
        if (params.model === 'gemini-3.5-flash') {
          console.warn("Attempting final fallback to gemini-3.1-flash-lite due to persistent overload or errors...");
          try {
            const fallbackResponse = await client.models.generateContent({
              ...params,
              model: "gemini-3.1-flash-lite"
            });
            return fallbackResponse;
          } catch (fallbackErr: any) {
            console.error("Final fallback to gemini-3.1-flash-lite also failed:", fallbackErr);
            throw fallbackErr;
          }
        }
        throw err;
      }

      if (isTransient) {
        const currentDelay = delay * Math.pow(2, attempt - 1) + Math.random() * 550;
        console.log(`Transient limit/error detected. Retrying in ${Math.round(currentDelay)}ms...`);
        await new Promise(resolve => setTimeout(resolve, currentDelay));
      } else {
        throw err;
      }
    }
  }
}

function buildBrandPrompt(brandIdentity: any): string {
  if (!brandIdentity || !brandIdentity.isActive) {
    return "";
  }
  return `\n[ALIGNEMENT DE MARQUE MANDATAIRE]
Vous devez impérativement aligner la génération de contenu avec l'identité de marque configurée ci-dessous :
- Cible Marketing visée : "${brandIdentity.targetAudience}"
- Ton de voix éditorial signature : "${brandIdentity.editorialTone}"
- Mots-clés de marque stratégiques à intégrer ou à respecter thématiquement : "${brandIdentity.keywords}"
- Couleurs de marque thématiques (si pertinent) : Primaire: "${brandIdentity.primaryColor}", Secondaire: "${brandIdentity.secondaryColor}"
Assurez-vous de calquer l'ambiance, l'esthétique, le vocabulaire et le style éditorial sur cette marque.\n`;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API Routes ---

  // Healthcheck Route
  app.get("/api/health", (req: Request, res: Response) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // 1. Social Post Generator
  app.post("/api/generate-social", async (req: Request, res: Response) => {
    const { topic, tone, brandIdentity } = req.body;
    try {
      if (!topic) {
        return res.status(400).json({ error: "Le sujet ou projet est obligatoire." });
      }

      const response = await generateContentWithRetry({
        model: "gemini-3.5-flash",
        contents: `Génère des variantes de posts pour les réseaux sociaux (LinkedIn, Twitter/X, Instagram) basées sur le sujet suivant.
Sujet: "${topic}"
Ton de voix: "${tone || 'professionnel'}"
${buildBrandPrompt(brandIdentity)}

Directives de formatage:
- LinkedIn: Un post structuré avec un super hook, des paragraphes aérés, des puces (bullet points) élégantes et 3-5 hashtags ciblés.
- Twitter: Un message percutant de moins de 280 caractères, maximisant l'engagement et l'interaction.
- Instagram: Une suggestion de légende (caption) engageante et créative, plus une idée de visuel (image ou carrousel) décrivant ce qu'on doit voir sur la carte.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              linkedin: { type: Type.STRING, description: "Post LinkedIn complet, aéré et attractif." },
              twitter: { type: Type.STRING, description: "Texte Twitter de moins de 280 caractères." },
              instagram: { type: Type.STRING, description: "Texte de légende Instagram plus suggestion visuelle détaillée de la carte." },
            },
            required: ["linkedin", "twitter", "instagram"],
          },
        },
      });

      const data = parseGeminiJson(response.text);
      res.json({ success: true, data });
    } catch (error: any) {
      console.warn("API Key issue or model error in Social Generator, initiating programmatic fallback:", error.message || error);
      
      const pTopic = topic || "Projet Innovant";
      
      const linkedin = `🚀 **Pleins feux sur ${pTopic} !**\n\n` +
        `Nous sommes ravis de vous présenter notre dernière initiative majeure. Conçu avec passion, ${pTopic} repousse les limites pour apporter une solution concrète, robuste et élégante aux défis actuels de notre secteur.\n\n` +
        `Pourquoi c'est un game-changer ?\n` +
        `• ⚡ **Performance accrue** pour une efficacité maximale au quotidien\n` +
        `• 🎨 **Expérience utilisateur de premier ordre** soignée dans les moindres détails\n` +
        `• 🔧 **Robustesse technique** garantie par l'architecture artisanale de handCode\n\n` +
        `Vous voulez en savoir plus ou échanger sur vos besoins d'automatisation ? Planifions un appel !\n\n` +
        `#Innovation #Tech #Productivite #DigitalArtisan`;

      const twitter = `⚡ Découvrez comment ${pTopic} révolutionne la gestion de projets et booste l'efficacité opérationnelle ! Une approche moderne, agile et ultra-performante.\n\n` +
        `👉 Contactez-nous pour une démo ! #Innovation #Startup`;

      const instagram = `✨ CAPTION :\n` +
        `Le futur s'écrit maintenant avec ${pTopic}. Nous façonnons des outils digitaux précis comme de l'orfèvrerie pour amplifier votre impact au quotidien. 📱💎\n\n` +
        `Que vous soyez créateur, entrepreneur ou leader technique, découvrez notre vision d'un numérique sur-mesure.\n\n` +
        `#DigitalArtisan #Design #Productivity #Minimalism\n\n` +
        `🎨 IDÉE DE VISUEL :\n` +
        `Une carte moderne minimaliste dark-mode mettant en valeur le titre "${pTopic}" sous une lumière néon orange subtile, avec des indicateurs de performance épurés en arrière-plan.`;

      const fallbackData = { linkedin, twitter, instagram, apiKeyWarning: true };
      res.json({ success: true, data: fallbackData });
    }
  });

  // 2. Smart Snippet & Component Generator
  app.post("/api/generate-code", async (req: Request, res: Response) => {
    const { prompt, language } = req.body;
    try {
      if (!prompt) {
        return res.status(400).json({ error: "Le prompt de code est obligatoire." });
      }

      const response = await generateContentWithRetry({
        model: "gemini-3.5-flash",
        contents: `Génère un snippet ou composant de code extrêmement propre, sécurisé et réutilisable dans le langage et le contexte demandé.
Composant demandé: "${prompt}"
Langage/Outil: "${language || 'Tailwind & HTML'}"

Sécurise le code et assure-toi qu'il respecte les meilleures pratiques de développement moderne, sans fioritures inutiles, commenté sobrement.
Pour Tailwind, utilise des classes esthétiques et modernes (effets sombres premium, arrondis légers, transitions fluides).`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              code: { type: Type.STRING, description: "Le code source propre et prêt à être copié." },
              explanation: { type: Type.STRING, description: "Explication courte et technique du fonctionnement du code." },
            },
            required: ["code", "explanation"],
          },
        },
      });

      const data = parseGeminiJson(response.text);
      res.json({ success: true, data });
    } catch (error: any) {
      console.warn("API Key issue or model error in Code Generator, initiating programmatic fallback:", error.message || error);
      
      const pPrompt = prompt || "Composant moderne";
      const pLanguage = language || "Tailwind & HTML";
      
      const isReact = pLanguage.toLowerCase().includes("react") || pLanguage.toLowerCase().includes("tsx") || pLanguage.toLowerCase().includes("jsx");
      
      let code = "";
      let explanation = "";

      if (isReact) {
        const componentClassName = pPrompt.replace(/[^a-zA-Z0-9]/g, "") || 'CustomComponent';
        code = `import React, { useState } from 'react';\n` +
          `import { Sparkles, Code2, AlertCircle } from 'lucide-react';\n\n` +
          `interface ${componentClassName}Props {\n` +
          `  title?: string;\n` +
          `  className?: string;\n` +
          `}\n\n` +
          `export default function CustomPremiumComponent({ title = "${pPrompt}", className = "" }: ${componentClassName}Props) {\n` +
          `  const [active, setActive] = useState(false);\n\n` +
          `  return (\n` +
          `    <div className={\`p-6 bg-zinc-900 border border-zinc-805/40 rounded-2xl shadow-xl hover:border-orange-500/30 transition-all duration-300 \${className}\`}>\n` +
          `      <div className="flex items-center justify-between mb-4">\n` +
          `        <div className="flex items-center gap-2.5">\n` +
          `          <span className="p-2 bg-orange-500/10 border border-orange-500/20 rounded-xl text-orange-400">\n` +
          `            <Code2 className="h-4 w-4" />\n` +
          `          </span>\n` +
          `          <h4 className="font-bold text-sm tracking-wide text-white uppercase">{title}</h4>\n` +
          `        </div>\n` +
          `        <span className="text-[10px] font-mono px-2 py-0.5 bg-orange-500/10 text-orange-400 border border-orange-500/25 rounded-md">\n` +
          `          Production-Ready\n` +
          `        </span>\n` +
          `      </div>\n` +
          `      \n` +
          `      <p className="text-xs text-zinc-400 leading-relaxed mb-5">\n` +
          `        Composant optimisé généré par l'Agent Bâtisseur. Prêt pour une intégration directe dans votre dashboard.\n` +
          `      </p>\n` +
          `      \n` +
          `      <button\n` +
          `        onClick={() => setActive(!active)}\n` +
          `        className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-black font-extrabold uppercase text-xs tracking-wider rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"\n` +
          `      >\n` +
          `        <Sparkles className="h-3.5 w-3.5" />\n` +
          `        {active ? 'Composant Activé' : 'Activer le Composant'}\n` +
          `      </button>\n` +
          `    </div>\n` +
          `  );\n` +
          `}`;
        explanation = "Composant React de production hautement soigné écrit en TypeScript, décoré de classes Tailwind et entièrement typé. Comprend de l'interactivité d'état et des icônes issues de Lucide-React.";
      } else {
        // Safe standard HTML/Tailwind block
        code = `<!-- Composant : ${pPrompt} -->\n` +
          `<div class="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl hover:border-orange-500/30 transition-all duration-300 max-w-sm font-sans">\n` +
          `  <div class="flex items-center justify-between mb-4">\n` +
          `    <div class="flex items-center space-x-3">\n` +
          `      <div class="p-2 bg-orange-500/10 border border-orange-500/20 rounded-xl text-orange-400">\n` +
          `        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m18 16 4-4-4-4M6 8l-4 4 4 4M14.5 4l-5 16"/></svg>\n` +
          `      </div>\n` +
          `      <h4 class="font-bold text-sm tracking-wide text-white uppercase">${pPrompt}</h4>\n` +
          `    </div>\n` +
          `    <span class="text-[10px] font-mono px-2 py-0.5 bg-orange-500/10 text-orange-400 border border-orange-500/25 rounded-md uppercase">V1.0</span>\n` +
          `  </div>\n` +
          `  <p class="text-xs text-zinc-400 leading-relaxed mb-5">\n` +
          `    Snippet d'intégration rapide codé en HTML fluide et stylisé par des utilitaires Tailwind CSS.\n` +
          `  </p>\n` +
          `  <button class="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-black font-extrabold uppercase text-xs tracking-wider rounded-xl transition-all duration-200 cursor-pointer">\n` +
          `    Confirmer l'action\n` +
          `  </button>\n` +
          `</div>`;
        explanation = "Code source HTML/CSS autonome et optimisé utilisant la grammaire utilitaire de Tailwind CSS pour un rendu épuré, responsive et moderne.";
      }

      res.json({ success: true, data: { code, explanation, apiKeyWarning: true } });
    }
  });

  // 3. Landing Page UX Copywriter & SEO Builder
  app.post("/api/generate-copy", async (req: Request, res: Response) => {
    const { idea, brandIdentity } = req.body;
    try {
      if (!idea) {
        return res.status(400).json({ error: "La description de votre idée est requise." });
      }

      const response = await generateContentWithRetry({
        model: "gemini-3.5-flash",
        contents: `Rédige une structure complète de Landing Page copywritée en UX, accompagnée des éléments de référencement SEO.
Idée du projet / SaaS: "${idea}"
${buildBrandPrompt(brandIdentity)}

Fournis des sections pour:
- Hero: Titre percutant, sous-titre explicatif, texte d'appel à l'action.
- Features: 3 fonctionnalités majeures avec leur bénéfice clé pour l'utilisateur.
- CTA final: Une relance d'action forte.
- SEO: Titre de page, méta description optimisée, et mots-clés performants.
- Hooks publicitaires: 3 accroches courtes pour de l'acquisition payante ou post d'annonce.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              hero: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  content: { type: Type.STRING },
                  ctaText: { type: Type.STRING },
                  tips: { type: Type.STRING, description: "Conseil de placement UX ou design" }
                },
                required: ["title", "content", "ctaText"]
              },
              features: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    content: { type: Type.STRING },
                    tips: { type: Type.STRING }
                  },
                  required: ["title", "content"]
                }
              },
              cta: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  content: { type: Type.STRING },
                  ctaText: { type: Type.STRING },
                  tips: { type: Type.STRING }
                },
                required: ["title", "content", "ctaText"]
              },
              seoTitle: { type: Type.STRING, description: "Titre SEO recommandé (max 60 caractères)" },
              seoDescription: { type: Type.STRING, description: "Description meta (max 160 caractères)" },
              keywords: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              hooks: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "3 crochets promotionnels percutants."
              }
            },
            required: ["hero", "features", "cta", "seoTitle", "seoDescription", "keywords", "hooks"],
          },
        },
      });

      const data = parseGeminiJson(response.text);
      res.json({ success: true, data });
    } catch (error: any) {
      console.warn("API Key issue or model error in Copywriting Generator, initiating programmatic fallback:", error.message || error);
      
      const pIdea = idea || "Projet Digital";
      
      const fallbackData = {
        hero: {
          title: `Révolutionnez votre quotidien avec ${pIdea}`,
          content: `L'outil tout-en-un conçu pour automatiser vos tâches les plus complexes. Gagnez des heures précieuses chaque semaine grâce à une interface épurée et intelligente connectée à vos outils préférés.`,
          ctaText: `Démarrer gratuitement maintenant`,
          tips: `Placez ce titre en haut en grande taille (font-sans font-extrabold text-4xl), souligné d'une fine bordure orange pour attirer l'œil instantanément.`
        },
        features: [
          {
            title: `Automatisation Totale`,
            content: `Plus besoin de copier-coller manuellement vos données. Vos flux métiers se synchronisent en temps réel entre vos applications favorites.`,
            tips: `Associez cette carte à une icône d'éclair (Zap) ou d'engrenage de couleur orange.`
          },
          {
            title: `Multi-Canal Intégré`,
            content: `Notifications SMS, alertes WhatsApp et rapports instantanés pour garder le contrôle de votre exploitation à chaque instant.`,
            tips: `Parfait pour rassurer les clients sur la réactivité de l'application.`
          },
          {
            title: `Sécurité de Niveau Bancaire`,
            content: `Toutes vos connexions Supabase et OAuth sont chiffrées et sécurisées selon les derniers protocoles industriels de pointe.`,
            tips: `Ajoutez un petit badge vert 'Sécurisé' pour renforcer la confiance des utilisateurs.`
          }
        ],
        cta: {
          title: `Prêt à déployer l'architecture de vos rêves ?`,
          content: `Rejoignez les dizaines de créateurs qui ont choisi handCode et ARTISAN_OS pour automatiser leur croissance sans écrire une seule ligne de code complexe.`,
          ctaText: `Bâtir mon projet en 1 Clic`,
          tips: `Insérez un rappel du délai d'installation (ex: "Déploiement immédiat en moins de 3 minutes").`
        },
        seoTitle: `${pIdea} - Automatisation & Excellence Digitale | handCode`,
        seoDescription: `Découvrez la plateforme ultime ${pIdea} pour fluidifier vos processus métiers, piloter vos bases de données et libérer votre potentiel créatif.`,
        keywords: [pIdea.toLowerCase().replace(/[^a-z0-9]/g, ""), "automatisation", "supabase", "nocode", "artisan-os", "web app", "productivite"],
        hooks: [
          `Marre des tâches répétitives ? Découvrez comment ${pIdea} fait le travail à votre place en arrière-plan.`,
          `Gagnez jusqu'à 15 heures de travail par semaine. Voici le secret bien gardé des meilleurs artisans du web.`,
          `L'intégration Supabase et Make enfin simplifiée. Connectez vos outils et regardez la magie opérer.`
        ],
        apiKeyWarning: true
      };

      res.json({ success: true, data: fallbackData });
    }
  });

  // 4. Design Asset & SVG Generator
  app.post("/api/generate-design", async (req: Request, res: Response) => {
    const { prompt, style, brandIdentity } = req.body;
    try {
      if (!prompt) {
        return res.status(400).json({ error: "Le prompt ou le concept de design est requis." });
      }

      const response = await generateContentWithRetry({
        model: "gemini-3.5-flash",
        contents: `Crée un guide de design d'identité visuelle moderne et génère un magnifique élément vectoriel SVG brut pour un solo Digital Artisan.
Prompt de concept: "${prompt}"
Ligne esthétique préférée: "${style || 'Premium Minimalist Dark'}"
${buildBrandPrompt(brandIdentity)}

Fournis:
1. Une palette de 5 couleurs harmonieuses avec code hexadécimal et rôle précis de chaque couleur (ex: Primary, Secondary, Background, Card, Text, Accent).
2. Un mariage typographique élégant (Police Titre et Police Corps).
3. Un prompt détaillé et optimisé pour Midjourney/Flux afin de générer d'autres visuels.
4. Un code SVG vectoriel interactif complet et autonome (entre de simples balises ou clé json brute sans commentaires bizarres). Le SVG doit être super soigné, stylisé, responsive (utiliser viewBox), et exploiter les couleurs de la palette générée pour représenter le concept graphique demandé. N'inclus ABSOLUMENT AUCUN texte décoratif inutile ou balise markdown parasite autour du SVG dans le champ de la clé JSON.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              styleName: { type: Type.STRING },
              palette: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    hex: { type: Type.STRING, description: "Code hex ex: #0F172A" },
                    role: { type: Type.STRING, description: "Primary, Secondary, Background, Card, Text, Accent" }
                  },
                  required: ["hex", "role"]
                }
              },
              fontPairing: {
                type: Type.OBJECT,
                properties: {
                  header: { type: Type.STRING },
                  body: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ["header", "body", "description"]
              },
              midjourneyPrompt: { type: Type.STRING, description: "Prompt ultra détaillé pour Midjourney/Flux" },
              svgIcon: { type: Type.STRING, description: "Code SVG valide direct autonome, ex: <svg viewBox=\\\"0 0 100 100\\\" ...>...</svg>" }
            },
            required: ["styleName", "palette", "fontPairing", "midjourneyPrompt", "svgIcon"],
          },
        },
      });

      const data = parseGeminiJson(response.text);
      res.json({ success: true, data });
    } catch (error: any) {
      console.warn("API Key issue or model error in Design Generator, initiating programmatic fallback:", error.message || error);
      
      const pPrompt = prompt || "Identité visuelle moderne";
      const styleName = style || "Premium Minimalist Slate";
      
      const fallbackData = {
        styleName,
        palette: [
          { hex: "#09090b", role: "Background (Zinc Deep)" },
          { hex: "#18181b", role: "Card (Zinc Solid)" },
          { hex: "#f97316", role: "Accent (Orange-500)" },
          { hex: "#fafafa", role: "Text Main (Off-White)" },
          { hex: "#a1a1aa", role: "Text Muted (Zinc-400)" }
        ],
        fontPairing: {
          header: "Space Grotesk",
          body: "Inter",
          description: "La typographie 'Space Grotesk' apporte un cachet technologique, asymétrique et ultra-moderne aux titres phares, tandis que 'Inter' garantit une lisibilité maximale pour les paragraphes et les formulaires denses sur mobile."
        },
        midjourneyPrompt: `/imagine prompt: Premium UIUX Dashboard layout for ${pPrompt}, dark slate canvas, orange high-contrast glowing micro-interactions, flat futuristic vector icons, elegant spacing, sleek typography, figma interface prototype, 8k resolution, photorealistic, --ar 16:9`,
        svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" class="w-full h-full text-orange-500" fill="none" stroke="currentColor" stroke-width="2">\n` +
          `  <rect x="10" y="10" width="80" height="80" rx="12" stroke="#f97316" stroke-opacity="0.25" fill="#18181b" />\n` +
          `  <path d="M30 35 L70 35 M30 50 L70 50 M30 65 L55 65" stroke="#fafafa" stroke-linecap="round" stroke-width="3" />\n` +
          `  <circle cx="70" cy="65" r="5" fill="#f97316" />\n` +
          `  <path d="M45 25 L55 25" stroke="#f97316" stroke-linecap="round" />\n` +
          `</svg>`,
        apiKeyWarning: true
      };

      res.json({ success: true, data: fallbackData });
    }
  });

  // 5. ManyChat Auto-Responder / Webhook Tunnel
  app.post(["/api/manychat-dynamic", "/api/webhook-receiver.php", "/handcode-hub/api/webhook-receiver.php"], async (req: Request, res: Response) => {
    try {
      const {
        message,
        subscriber,
        persona,
        keywords,
        objective,
        ctaText,
        ctaUrl,
        addLeadCapture,
        brandIdentity
      } = req.body;

      // Extract message with robust fallbacks for standard ManyChat webhooks
      const userMessage = message || req.body.last_input || req.body.text || req.body.comment_text || "Bonjour !";
      const senderName = subscriber?.first_name || req.body.first_name || "Abonné";
      const botPersona = persona || "Assistant commercial chaleureux";
      const botKeywords = keywords || "tarif, bonjour, offre";
      const botObjective = objective || "Informer l'utilisateur et générer un clic sur le bouton";
      const btnText = ctaText || "Découvrir";
      const btnUrl = ctaUrl || "https://handcode-labs.com";

      const response = await generateContentWithRetry({
        model: "gemini-3.5-flash",
        contents: `Tu es un répondeur automatisé intelligent (via ManyChat) connecté à la messagerie Instagram/Messenger d'un créateur ou d'un Digital Artisan.
Génère une réponse ultra courte, engageante et concise (maximum 2 à 3 lignes/phrases) pour cet abonné.

Informations du contexte :
- Prénom de l'abonné: "${senderName}"
- Message de l'abonné: "${userMessage}"
- Ton de voix & Persona du Bot: "${botPersona}"
- Mots-clés reliés à ce tunnel: "${botKeywords}"
- Objectif de conversion à atteindre: "${botObjective}"
- Texte du bouton d'appel à l'action final: "${btnText}"
- Capturer l'email en option ? : ${addLeadCapture ? "Oui, invite poliment l'abonné à donner son email s'il le souhaite de manière fluide dans ton message" : "Non, pas la peine de demander"}
${buildBrandPrompt(brandIdentity)}

Règles impératives :
1. Sois extrêmement concis (maximum 2 ou 3 phrases). Sur Instagram, l'attention est très courte !
2. Parle directement à l'abonné par son prénom "${senderName}".
3. Insère 1 ou 2 émojis maximum de manière naturelle.
4. Reste professionnel, dynamique et invite habilement l'abonné à cliquer sur le lien ou répondre.`,
      });

      const generatedText = response.text?.trim() || `Bonjour ${senderName} ! Merci pour ton message. Sens-toi libre d'utiliser le lien ci-dessous pour en savoir plus.`;

      // Return EXACT compliant ManyChat JSON Schema structure
      const manychatPayload = {
        version: "v2",
        content: {
          type: "instagram",
          messages: [
            {
              type: "text",
              text: generatedText,
              buttons: [
                {
                  type: "url",
                  caption: btnText.substring(0, 20), // ManyChat buttons caption max 20 chars
                  url: btnUrl
                }
              ]
            }
          ]
        }
      };

      res.json(manychatPayload);
    } catch (error: any) {
      console.error("Error in ManyChat tunnel webhook:", error);
      // Fallback clean payload in case of errors so ManyChat flow never breaks
      res.json({
        version: "v2",
        content: {
          type: "instagram",
          messages: [
            {
              type: "text",
              text: "Hello ! Merci pour ton intérêt. Notre serveur d'automatisation IA est en cours de synchronisation. Clique ci-dessous pour découvrir nos services !",
              buttons: [
                {
                  type: "url",
                  caption: "En savoir plus",
                  url: "https://handcode-labs.com"
                }
              ]
            }
          ]
        }
      });
    }
  });

  // 6. Brief AI & Dynamic Documents Generator
  app.post("/api/generate-brief", async (req: Request, res: Response) => {
    const { answers, clientName, projectName, brandIdentity } = req.body;
    try {
      if (!answers) {
        return res.status(400).json({ error: "Les réponses de cadrage sont requises." });
      }

      const response = await generateContentWithRetry({
        model: "gemini-3.5-flash",
        contents: `Génère un dossier complet de cadrage de projet (PRD, Cahier des charges technique et Devis chiffré) basé sur les informations client suivantes :
Nom du client: "${clientName || 'Nouveau Client'}"
Nom du projet: "${projectName || 'Projet Innovant'}"
${buildBrandPrompt(brandIdentity)}

Réponses au brief d'évaluation :
${JSON.stringify(answers, null, 2)}

Directives impératives pour chaque section :
1. PRD (Product Requirement Document) :
   - Summary : Présente un résumé exécutif limpide, moderne et captivant qui montre la compréhension complète des besoins du client.
   - TargetAudience : Définit les personas et les attentes spécifiques des utilisateurs finaux du site ou de l'application.
   - Features : Liste structurée des fonctionnalités clés requises, avec description détaillée et degré de priorité (Haute, Moyenne, Basse).
   - TechStack : Recommandations d'architectures modernes (ex: React, NextJS, Node, Tailwind, Firebase ou Cloud SQL).

2. Cahier des charges :
   - Architecture : Propose l'arborescence recommandée (pages principales, secondaires, parcours de navigation).
   - StyleDirection : Conseil artistique (palette, humeur, ambiance responsive, direction UX) idéal avec le branding d'identité.
   - TechnicalConstraints : Directives concrètes de résilience (sécurité, conformité RGPD, vitesse de chargement, accessibilité).
   - Deliverables : Les livrables officiels tangibles qui seront transmis.

3. Devis (Quote) :
   - Items : Détaille une liste logique d'items de prestation cohérents avec les fonctionnalités du projet. Fournis des estimations réalistes d'heures et un taux horaire (ex: de 60€ à 120€ selon la technicité).
   - Milestones : Propose 3 jalons (milestones) de paiements stratégiques et structurés (ex: Acompte 30% au briefing, Validation Maquettes 40%, Livraison Finale/Recette 30%).`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              prd: {
                type: Type.OBJECT,
                properties: {
                  summary: { type: Type.STRING },
                  targetAudience: { type: Type.STRING },
                  features: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        desc: { type: Type.STRING },
                        priority: { type: Type.STRING }
                      },
                      required: ["name", "desc", "priority"]
                    }
                  },
                  techStack: { type: Type.STRING }
                },
                required: ["summary", "targetAudience", "features", "techStack"]
              },
              specifications: {
                type: Type.OBJECT,
                properties: {
                  architecture: { type: Type.STRING },
                  styleDirection: { type: Type.STRING },
                  technicalConstraints: { type: Type.STRING },
                  deliverables: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  }
                },
                required: ["architecture", "styleDirection", "technicalConstraints", "deliverables"]
              },
              quote: {
                type: Type.OBJECT,
                properties: {
                  clientName: { type: Type.STRING },
                  projectName: { type: Type.STRING },
                  items: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        description: { type: Type.STRING },
                        hours: { type: Type.NUMBER },
                        rate: { type: Type.NUMBER }
                      },
                      required: ["description", "hours", "rate"]
                    }
                  },
                  milestones: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        step: { type: Type.STRING },
                        percentage: { type: Type.NUMBER }
                      },
                      required: ["step", "percentage"]
                    }
                  }
                },
                required: ["clientName", "projectName", "items", "milestones"]
              }
            },
            required: ["prd", "specifications", "quote"],
          },
        },
      });

      const data = parseGeminiJson(response.text);
      res.json({ success: true, data });
    } catch (error: any) {
      console.warn("API Key issue or model error in Brief Generator, initiating programmatic fallback:", error.message || error);
      
      const pClient = clientName || "Nouveau Client";
      const pProject = projectName || "Projet Innovant";
      
      const fallbackData = {
        prd: {
          summary: `Dossier de cadrage pour le projet ${pProject}. L'objectif est de mettre en place une solution applicative hautement performante, automatisée et sécurisée. La solution vise à moderniser les opérations traditionnelles pour offrir un service instantané aux clients de ${pClient}.`,
          targetAudience: `Administrateurs internes de l'application, équipes opérationnelles sur le terrain pour la saisie directe, et clients finaux recherchant une transparence absolue de l'état d'avancement de leur dossier.`,
          features: [
            { name: "Tableau de Bord Administrateur", desc: "Suivi en temps réel des indicateurs clés, filtres dynamiques, et visualisation cartographique.", priority: "Haute" },
            { name: "Connecteur SMS & WhatsApp", desc: "Notification automatique des événements importants directement sur le téléphone des parties prenantes.", priority: "Moyenne" },
            { name: "Système de Gestion d'Identité & Profils", desc: "Authentification sécurisée avec rôles, privilèges d'accès et profils d'utilisateurs distincts.", priority: "Haute" }
          ],
          techStack: "React 18, Vite, Tailwind CSS, Supabase (PostgreSQL), Make (Integromat) pour les connexions tierces."
        },
        specifications: {
          architecture: "Page de Login -> Dashboard Principal -> Vue Liste & Détails des Fiches -> Section de Configuration des Webhooks d'Automatisation.",
          styleDirection: "Thème sombre premium (Zinc-900 / Orange-500 en accents). Typographie technologique épurée Space Grotesk pour les en-têtes et Inter pour les contenus textuels denses.",
          technicalConstraints: "Temps de chargement < 1.5s, RGPD-compliant (stockage en Union Européenne), Accessibilité WCAG 2.1 AA.",
          deliverables: [
            "Script de déploiement de base de données Supabase",
            "Code source complet de l'interface client éco-conçue",
            "Scénario d'automatisation Make (Integromat)",
            "Guide d'utilisation et de prise en main destiné aux administrateurs"
          ]
        },
        quote: {
          clientName: pClient,
          projectName: pProject,
          items: [
            { description: "Cadrage, Architecture Métier & Modélisation de la base Supabase", hours: 14, rate: 85 },
            { description: "Développement des vues d'administration React & Responsive CSS Tailwind", hours: 28, rate: 85 },
            { description: "Déploiement des connecteurs d'API & Automates d'alertes", hours: 12, rate: 85 }
          ],
          milestones: [
            { step: "Acompte initial de cadrage", percentage: 30 },
            { step: "Livrables intermédiaires pour validation de l'interface", percentage: 40 },
            { step: "Recette finale & transfert de propriété intellectuelle", percentage: 30 }
          ]
        },
        apiKeyWarning: true
      };

      res.json({ success: true, data: fallbackData });
    }
  });

  // 7. Dynamic AI Commercial Agent Qualification & Advisory
  app.post("/api/qualify-lead", async (req: Request, res: Response) => {
    const { name, company, problem, budgetFCFA, timelineWeeks, brandIdentity } = req.body;
    try {
      if (!name || !problem) {
        return res.status(400).json({ error: "Le nom du prospect et la description de son problème sont obligatoires." });
      }

      const budgetVal = Number(budgetFCFA) || 0;
      const timelineVal = Number(timelineWeeks) || 3;

      const response = await generateContentWithRetry({
        model: "gemini-3.5-flash",
        contents: `Tu es le Directeur Commercial Virtuel de l'agence handCode spécialisée dans les automatisations d'artisanat numérique, les bases de données relationnelles Supabase et les connecteurs NoCode Make (Integromat).
Analyse la demande de ce prospect entrant :
- Nom : "${name}"
- Entreprise/Projet : "${company || 'Non spécifié'}"
- Problème principal à automatiser : "${problem}"
- Budget estimé : ${budgetVal} FCFA
- Délai/Échéance souhaitée : ${timelineVal} semaines

RÈGLES DE DÉCISION ET QUALIFICATION :
1. Critère de Budget : Notre seuil d'intervention pour un projet d'agence clé en main personnalisé est de 1 000 000 FCFA.
   - Si le budget est >= 1 000 000 FCFA, la décision est "QUALIFIED".
   - Si le budget est < 1 000 000 FCFA, la décision est "DISQUALIFIED".
2. Critère de Maturité : Évalue si le besoin est clair et technique. Une demande claire décrivant des flux ou des étapes d'exploitation précis doit obtenir un score élevé.
3. Critère de Faisabilité (Urgence & Adéquation Stacks) : Évalue si le projet est réalisable rapidement (3 semaines) avec nos stacks (Supabase, Make, NoCode).

RÉPONSES ÉDITORIALES ATTENDUES :
- prospectResponse : Rédige une réponse professionnelle, polie et directe en français :
  * Si qualifié : Confirme l'intérêt du projet de manière experte. Valide la faisabilité avec nos stacks (Supabase, Make). Propose un créneau court de rendez-vous de diagnostic (lien Calendly : https://calendly.com/handcode/cadrage).
  * Si non-qualifié : Rédige un e-mail poli et bienveillant. Explique que nous ne pouvons pas accompagner ce projet sur-mesure clé en main sous format agence en raison de notre seuil critique de budget (1 000 000 FCFA). Donne un conseil d'architecture technique concret, pragmatique et orienté (étape par étape avec Make, Google Sheets ou d'autres outils simples) pour les aider à tester leur concept seuls.
  * Structure requise pour l'e-mail : [Accroche personnalisée] + [Validation de la faisabilité] + [Prochaine étape ou conseil d'architecture alternatif].
- slackReport : Écris un rapport récapitulatif destiné à Slack pour le fondateur de l'agence. Il doit tenir en 3 phrases maximum absolue, indiquant les enjeux de l'opportunité et la décision de triage prise.
${buildBrandPrompt(brandIdentity)}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              decision: { type: Type.STRING, description: "Doit être EXACTEMENT 'QUALIFIED' ou 'DISQUALIFIED'" },
              criteria: {
                type: Type.OBJECT,
                properties: {
                  budget: {
                    type: Type.OBJECT,
                    properties: {
                      score: { type: Type.NUMBER, description: "Score sur 100" },
                      text: { type: Type.STRING, description: "Explication concise de l'adéquation budgétaire en FCFA face au seuil de 1M" },
                      status: { type: Type.STRING, description: "'success', 'warning' ou 'error'" }
                    },
                    required: ["score", "text", "status"]
                  },
                  maturity: {
                    type: Type.OBJECT,
                    properties: {
                      score: { type: Type.NUMBER, description: "Score sur 100" },
                      text: { type: Type.STRING, description: "Explication de la maturité technique du besoin" },
                      status: { type: Type.STRING, description: "'success', 'warning' ou 'error'" }
                    },
                    required: ["score", "text", "status"]
                  },
                  feasibility: {
                    type: Type.OBJECT,
                    properties: {
                      score: { type: Type.NUMBER, description: "Score sur 100" },
                      text: { type: Type.STRING, description: "Faisabilité technique avec Supabase/Make" },
                      status: { type: Type.STRING, description: "'success', 'warning' ou 'error'" }
                    },
                    required: ["score", "text", "status"]
                  }
                },
                required: ["budget", "maturity", "feasibility"]
              },
              prospectResponse: { type: Type.STRING, description: "Le courrier électronique complet rédigé avec structure" },
              slackReport: { type: Type.STRING, description: "Le rapport Slack condensé pour le Dashboard (Maximum 3 phrases)" }
            },
            required: ["decision", "criteria", "prospectResponse", "slackReport"]
          }
        }
      });

      const data = parseGeminiJson(response.text);
      res.json({ success: true, data });
    } catch (error: any) {
      console.warn("API Key issue or model error in Lead Qualification, initiating programmatic fallback:", error.message || error);
      
      const pName = name || "Prospect Inconnu";
      const pCompany = company || "Entreprise non précisée";
      const pProblem = problem || "Besoin d'accompagnement";
      const budgetValInput = Number(budgetFCFA) || 0;
      
      const isQualified = budgetValInput >= 1000000;
      const decision = isQualified ? "QUALIFIED" : "DISQUALIFIED";
      
      const budgetStatus = isQualified ? "success" : "error";
      const budgetText = isQualified 
        ? `Le budget déclaré de ${budgetValInput.toLocaleString('fr-FR')} FCFA surpasse notre seuil d'éligibilité de 1 000 000 FCFA.`
        : `Le budget déclaré de ${budgetValInput.toLocaleString('fr-FR')} FCFA est inférieur au seuil de l'agence (1 000 000 FCFA) pour du clé en main.`;

      const prospectResponse = isQualified
        ? `Bonjour ${pName},\n\n` +
          `C'est un plaisir de prendre connaissance de votre beau projet pour ${pCompany}.\n\n` +
          `Après une première analyse par nos architectes, votre besoin d'automatisation ("${pProblem}") correspond idéalement à notre expertise combinée sur Supabase et l'écosystème NoCode. Nous avons déjà déployé des cas d'utilisation similaires avec des gains de productivité instantanés pour nos clients.\n\n` +
          `Au vu de la complexité technique et du budget associé, nous serions ravis de planifier votre atelier de cadrage gratuit de 15 minutes.\n\n` +
          `👉 Réservez votre créneau directement ici : https://calendly.com/handcode/cadrage\n\n` +
          `Excellente journée,\n` +
          `L'équipe de Direction Commerciale handCode`
        : `Bonjour ${pName},\n\n` +
          `Merci chaleureusement de l'intérêt porté à handCode et à notre solution ARTISAN_OS.\n\n` +
          `Votre besoin d'automatiser la problématique suivante : "${pProblem}" est tout à fait pertinent et extrêmement prometteur.\n\n` +
          `Cependant, notre format d'agence sur-mesure clé en main s'adresse exclusivement à des architectures complexes avec un seuil budgétaire minimal d'entrée de 1 000 000 FCFA. De ce fait, nous ne pourrons pas vous proposer un accompagnement avec développement sur-mesure pour ce budget.\n\n` +
          `💡 NOTRE CONSEIL TECHNIQUE GRATUIT POUR RÉUSSIR SEUL : \n` +
          `1. Utilisez une base Google Sheets comme référentiel de données de départ.\n` +
          `2. Créez un compte gratuit sur Make (Integromat) pour créer un connecteur entre votre WhatsApp / formulaire d'entrée et cette feuille.\n` +
          `3. Rédigez un prompt simple pour traiter les messages entrants via l'API OpenAI ou Gemini.\n` +
          `Cette architecture frugale vous permettra d'obtenir un prototype 100% fonctionnel en moins de 4 heures pour un coût mensuel quasi-nul !\n\n` +
          `Nous restons à votre entière disposition et vous souhaitons un franc succès dans votre projet.\n\n` +
          `Bien cordialement,\n` +
          `L'équipe de Direction Commerciale handCode`;

      const slackReport = isQualified
        ? `🚨 Nouveau Lead Chaud Qualifié ! ${pName} (${pCompany}) souhaite automatiser : "${pProblem.substring(0, 48)}...". Budget déclaré à ${budgetValInput.toLocaleString('fr-FR')} FCFA. Prêt de rendez-vous en cours.`
        : `ℹ️ Lead Frugal Disqualifié. ${pName} (${pCompany}) a un budget de ${budgetValInput.toLocaleString('fr-FR')} FCFA. Courrier de conseil envoyé avec succès pour autonomie sur Make.`;

      const fallbackData = {
        decision,
        criteria: {
          budget: {
            score: isQualified ? 100 : 35,
            text: budgetText,
            status: budgetStatus
          },
          maturity: {
            score: 85,
            text: "Le client exprime un besoin métier réel avec des étapes de traitement de données pré-identifiées.",
            status: "success"
          },
          feasibility: {
            score: 90,
            text: "Très forte faisabilité avec nos stacks modulaires d'automatisation (Make / Supabase).",
            status: "success"
          }
        },
        prospectResponse,
        slackReport,
        apiKeyWarning: true
      };

      res.json({ success: true, data: fallbackData });
    }
  });

  // 7.5. Agent Bâtisseur - Project Generator
  app.post("/api/generate-project", async (req: Request, res: Response) => {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Le descriptif du projet est obligatoire." });
    }

    try {
      const systemInstruction = `Tu es l'Architecte Technique Senior de l'agence handCode. Ton rôle est de générer du code robuste, sécurisé et prêt pour la production dans ARTISAN_OS, tout en produisant automatiquement un Manuel d'Utilisation.

TES RÈGLES D'OR DE GÉNÉRATION À RESPECTER ABSOLUMENT :

1. ARCHITECTURE SQL : 
   - Utilise des noms de tables explicites basés sur le métier (ex: 'projects', 'clients', 'inventory').
   - Ajoute des commentaires SQL avec des tirets -- pour chaque table et chaque colonne expliquant son rôle métier précis.
   - Utilise systématiquement des clés étrangères (Foreign Keys) pour modéliser les relations entre tables.
   - Utilise des types de données précis et modernes (UUID, TEXT, VARCHAR, NUMERIC, TIMESTAMP WITH TIME ZONE, BOOLEAN).

2. COMPOSANTS REACT (TypeScript & Tailwind) :
   - Structure le code de manière modulaire, propre et lisible.
   - Gère systématiquement les états de chargement (isLoading / loading) et les erreurs (error) dans tes composants.
   - Ajoute des commentaires pour expliciter les props attendues et le typage TypeScript.
   - Utilise des composants UI modernes, cohérents avec la charte graphique dark-mode d'ARTISAN_OS (utilisation des couleurs zinc-900, zinc-800, orange-500 pour les accents, typographies épurées).
   - Intègre systématiquement un jeu de données "mock" cohérent et simulé dans ton composant pour permettre un test de démonstration immédiat.

3. LOGIQUE API (Supabase) :
   - Préfère des fonctions d'API robustes adaptées aux tables. Tu peux aussi créer des fonctions API génériques ou ciblées qui acceptent le nom de la table ou les paramètres adéquats.
   - Utilise impérativement des interfaces TypeScript pour typer toutes les données retournées ou reçues depuis Supabase.
   - Utilise une gestion d'erreur propre et explicite avec try/catch et logs détaillés.

4. DOCUMENTATION ET MANUEL UTILISATEUR :
   - Génère un manuel d'utilisation complet rédigé en Markdown clair, structuré pour un client non-technique.
   - Ce manuel doit inclure : l'objectif du module, les étapes pas-à-pas pour l'utilisation des boutons/actions, et une section "Support" pour contacter handCode.

RÈGLES DE FORMATAGE / BLOCS :
Renvoie les données structurées sous la forme d'un objet JSON contenant exactement ces quatre propriétés :
- sql: le script de création de base débutant impérativement par le marqueur "[BLOCK_SQL]" sur sa première ligne.
- ui: le code React complet débutant impérativement par le marqueur "[BLOCK_REACT]" sur sa première ligne.
- api: le code logique API complet débutant impérativement par le marqueur "[BLOCK_API]" sur sa première ligne.
- manual: le manuel d'utilisation au format Markdown débutant impérativement par le marqueur "[BLOCK_MANUAL_MARKDOWN]" sur sa première ligne.`;

      const response = await generateContentWithRetry({
        model: "gemini-3.5-flash",
        contents: `Voici le cahier des charges ou descriptif du projet à modéliser et coder :\n\n"${prompt}"`,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              sql: { type: Type.STRING, description: "Script SQL débutant par [BLOCK_SQL], commenté ligne par ligne avec clés étrangères" },
              ui: { type: Type.STRING, description: "Composant React / Tailwind complet débutant par [BLOCK_REACT] avec typage TS et mock data intégrés" },
              api: { type: Type.STRING, description: "Fonctions API d'intégration Supabase débutant par [BLOCK_API] avec gestion d'erreurs" },
              manual: { type: Type.STRING, description: "Manuel utilisateur au format Markdown débutant par [BLOCK_MANUAL_MARKDOWN] avec section Objectif, Guide et Support" }
            },
            required: ["sql", "ui", "api", "manual"]
          }
        }
      });

      const data = parseGeminiJson(response.text);
      res.json({ success: true, data });
    } catch (error: any) {
      console.warn("API Key issue or model error in Builder Agent API, initiating programmatic fallback generator:", error.message || error);
      
      const pLower = prompt.toLowerCase();
      
      // Determine if it matches Resto-Livr/Repas/Livreurs/Deliveries
      const isRestoLivr = pLower.includes("resto") || pLower.includes("livr") || pLower.includes("repas") || pLower.includes("abidjan") || pLower.includes("cmd") || pLower.includes("manger") || pLower.includes("commandes") || pLower.includes("delivery") || pLower.includes("courier");
      const isEcommerce = pLower.includes("e-commerce") || pLower.includes("lome") || pLower.includes("lome") || pLower.includes("cosmetic") || pLower.includes("boutique") || pLower.includes("shop") || pLower.includes("ventes") || pLower.includes("stock") || pLower.includes("produit") || pLower.includes("product") || pLower.includes("inventair");
      const isCrm = pLower.includes("crm") || pLower.includes("lead") || pLower.includes("prospect") || pLower.includes("client") || pLower.includes("pipeline") || pLower.includes("commercial");

      let fallbackData = {
        sql: "",
        ui: "",
        api: "",
        manual: "",
        apiKeyWarning: true
      };

      if (isRestoLivr) {
        fallbackData.sql = `[BLOCK_SQL]\n` +
          `-- =========================================================\n` +
          `-- SCHÉMA SQL SUPABASE - PROJET RESTO-LIVR (JEAN-LUC K.)\n` +
          `-- =========================================================\n\n` +
          `-- Table des livreurs / coursiers partenaires d'Abidjan\n` +
          `CREATE TABLE public.couriers (\n` +
          `    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n` +
          `    name TEXT NOT NULL,\n` +
          `    phone TEXT NOT NULL,\n` +
          `    email TEXT UNIQUE,\n` +
          `    status TEXT DEFAULT 'Disponible' NOT NULL CHECK (status IN ('Disponible', 'En livraison')),\n` +
          `    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL\n` +
          `);\n\n` +
          `-- Table des commandes / livraisons de repas\n` +
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
          `-- Indexation de performance pour la jointure et le filtrage des livraisons\n` +
          `CREATE INDEX idx_orders_courier ON public.orders(courier_id);\n` +
          `CREATE INDEX idx_orders_status ON public.orders(status);\n\n` +
          `-- Insertion de données de test de démonstration\n` +
          `INSERT INTO public.couriers (name, phone, email, status) VALUES\n` +
          `('Abdoulaye Touré', '+225 07 48 99 12 34', 'abdoulaye@resto-livr.ci', 'Disponible'),\n` +
          `('Koffi Kouamé', '+225 05 55 11 22 33', 'koffi@resto-livr.ci', 'Disponible'),\n` +
          `('Moussa Diakité', '+225 01 02 03 04 05', 'moussa@resto-livr.ci', 'En livraison');\n`;

        fallbackData.ui = `[BLOCK_REACT]\n` +
          `import React, { useState } from 'react';\n` +
          `import { Truck, Clock, AlertCircle, CheckCircle, ArrowRight, MapPin, Phone } from 'lucide-react';\n\n` +
          `// Interfaces TypeScript d'Interface\n` +
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
          `interface DeliveryUpdateControlProps {\n` +
          `  order: Order;\n` +
          `  availableCouriers: Courier[];\n` +
          `  onStartDelivery: (orderId: string, courierId: string) => Promise<void>;\n` +
          `}\n\n` +
          `export default function DeliveryUpdateControl({ order, availableCouriers, onStartDelivery }: DeliveryUpdateControlProps) {\n` +
          `  const [selectedCourierId, setSelectedCourierId] = useState('');\n` +
          `  const [loading, setLoading] = useState(false);\n` +
          `  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);\n\n` +
          `  const handleStatusChange = async () => {\n` +
          `    if (!selectedCourierId) {\n` +
          `      setMessage({ text: 'Veuillez assigner un livreur disponible.', isError: true });\n` +
          `      return;\n` +
          `    }\n` +
          `    setLoading(true);\n` +
          `    setMessage(null);\n` +
          `    try {\n` +
          `      await onStartDelivery(order.id, selectedCourierId);\n` +
          `      setMessage({ text: 'Excellent ! La commande est passée \"En cours\" et assignée au coursier.', isError: false });\n` +
          `    } catch (err: any) {\n` +
          `      setMessage({ text: err.message || 'Une erreur est survenue lors de l\\'assignation.', isError: true });\n` +
          `    } finally {\n` +
          `      setLoading(false);\n` +
          `    }\n` +
          `  };\n\n` +
          `  return (\n` +
          `    <div className="bg-[#12131a] rounded-xl border border-orange-500/20 p-5 w-full max-w-lg mx-auto font-sans shadow-xl text-white">\n` +
          `      <div className="flex justify-between items-start border-b border-white/5 pb-4 mb-4">\n` +
          `        <div>\n` +
          `          <span className="text-[10px] bg-orange-500/10 border border-orange-500/30 text-orange-400 font-mono px-2 py-0.5 rounded-full uppercase tracking-widest font-bold">\n` +
          `            STATUT : {order.status}\n` +
          `          </span>\n` +
          `          <h4 className="text-base font-bold text-white mt-2 leading-tight">{order.customer_name}</h4>\n` +
          `          <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">\n` +
          `            <MapPin className="h-3 w-3 text-orange-500" /> {order.delivery_address}\n` +
          `          </p>\n` +
          `        </div>\n` +
          `        \n` +
          `        <div className="text-right">\n` +
          `          <p className="text-xs text-slate-500">Restaurant</p>\n` +
          `          <p className="text-sm font-semibold text-orange-400">{order.restaurant_name}</p>\n` +
          `          <p className="text-xs text-emerald-400 font-mono mt-1 font-bold">{order.price.toLocaleString('fr-FR')} FCFA</p>\n` +
          `        </div>\n` +
          `      </div>\n\n` +
          `      <div className="space-y-4">\n` +
          `        {order.status === 'En attente' ? (\n` +
          `          <div className="space-y-3">\n` +
          `            <div className="bg-orange-950/25 border border-orange-500/10 p-3 rounded-lg flex items-start gap-2.5">\n` +
          `              <AlertCircle className="h-4 w-4 text-orange-400 shrink-0 mt-0.5" />\n` +
          `              <p className="text-[11px] text-slate-300 leading-relaxed">\n` +
          `                Cette commande est <strong>en attente</strong> de prise en charge. Sélectionnez un livreur actif pour initier la livraison à Abidjan.\n` +
          `              </p>\n` +
          `            </div>\n\n` +
          `            <label className="text-[11px] font-mono text-slate-400 block uppercase font-bold tracking-wider">\n` +
          `              Assigner un Coursier Partenaire :\n` +
          `            </label>\n` +
          `            <select\n` +
          `              value={selectedCourierId}\n` +
          `              onChange={(e) => setSelectedCourierId(e.target.value)}\n` +
          `              className="w-full bg-black border border-white/10 rounded-lg p-2.5 text-xs text-white focus:border-orange-500/50 outline-none cursor-pointer"\n` +
          `            >\n` +
          `              <option value="">-- Choisissez un coursier disponible --</option>\n` +
          `              {availableCouriers.map((courier) => (\n` +
          `                <option key={courier.id} value={courier.id}>\n` +
          `                  {courier.name} ({courier.phone})\n` +
          `                </option>\n` +
          `              ))}\n` +
          `            </select>\n\n` +
          `            <button\n` +
          `              onClick={handleStatusChange}\n` +
          `              disabled={loading || !selectedCourierId}\n` +
          `              className="w-full py-2.5 bg-orange-600 hover:bg-orange-500 text-black font-extrabold uppercase rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer text-xs disabled:bg-neutral-800 disabled:text-neutral-500"\n` +
          `            >\n` +
          `              {loading ? (\n` +
          `                <Clock className="h-4 w-4 animate-spin text-black" />\n` +
          `              ) : (\n` +
          `                <Truck className="h-4 w-4 text-black" />\n` +
          `              )}\n` +
          `              Passer la livraison \"En cours\"\n` +
          `              <ArrowRight className="h-3.5 w-3.5 text-black" />\n` +
          `            </button>\n` +
          `          </div>\n` +
          `        ) : (\n` +
          `          <div className="space-y-3">\n` +
          `            <div className="bg-emerald-950/25 border border-emerald-500/20 p-4 rounded-lg flex items-center gap-3 text-emerald-400">\n` +
          `              <CheckCircle className="h-5 w-5 shrink-0" />\n` +
          `              <div className="text-xs">\n` +
          `                <p className="font-bold uppercase tracking-wider">Livraison en cours</p>\n` +
          `                <p className="text-slate-300 mt-1">Le statut a été mis à jour à \"En cours\". Le livreur se rend au restaurant.</p>\n` +
          `              </div>\n` +
          `            </div>\n` +
          `          </div>\n` +
          `        )}\n\n` +
          `        {message && (\n` +
          `          <div className={\`p-3 rounded-lg text-xs leading-relaxed text-center font-mono \${` +
          `            message.isError \n` +
          `              ? 'bg-rose-950/35 border border-rose-500/20 text-rose-300' \n` +
          `              : 'bg-emerald-950/35 border border-emerald-500/20 text-emerald-300'\n` +
          `          }\`}>\n` +
          `            {message.text}\n` +
          `          </div>\n` +
          `        )}\n` +
          `      </div>\n` +
          `    </div>\n` +
          `  );\n` +
          `}\n`;

        fallbackData.api = `[BLOCK_API]\n` +
          `import { createClient } from '@supabase/supabase-js';\n\n` +
          `// Configuration du client Supabase\n` +
          `const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';\n` +
          `const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-key';\n` +
          `const supabase = createClient(supabaseUrl, supabaseKey);\n\n` +
          `/**\n` +
          ` * Récupère les commandes Resto-Livr\n` +
          ` */\n` +
          `export async function fetchOrdersAndDeliveries() {\n` +
          `  try {\n` +
          `    const { data, error } = await supabase\n` +
          `      .from('orders')\n` +
          `      .select('*, couriers(*)')\n` +
          `      .order('created_at', { ascending: false });\n` +
          `    if (error) throw error;\n` +
          `    return { data, error: null };\n` +
          `  } catch (error: any) {\n` +
          `    console.error('Erreur commandes:', error.message || error);\n` +
          `    return { data: null, error: error.message || error };\n` +
          `  }\n` +
          `}\n\n` +
          `/**\n` +
          ` * Filtre les livreurs disponibles\n` +
          ` */\n` +
          `export async function fetchAvailableCouriers() {\n` +
          `  try {\n` +
          `    const { data, error } = await supabase\n` +
          `      .from('couriers')\n` +
          `      .select('*')\n` +
          `      .eq('status', 'Disponible');\n` +
          `    if (error) throw error;\n` +
          `    return { data, error: null };\n` +
          `  } catch (error: any) {\n` +
          `    console.error('Erreur livreurs:', error.message || error);\n` +
          `    return { data: null, error: error.message || error };\n` +
          `  }\n` +
          `}\n\n` +
          `/**\n` +
          ` * Met à jour le statut d'une commande à 'En cours'\n` +
          ` */\n` +
          `export async function startOrderDelivery(orderId: string, courierId: string) {\n` +
          `  try {\n` +
          `    const { data: orderData, error: orderError } = await supabase\n` +
          `      .from('orders')\n` +
          `      .update({ status: 'En cours', courier_id: courierId })\n` +
          `      .eq('id', orderId)\n` +
          `      .select();\n\n` +
          `    if (orderError) throw orderError;\n\n` +
          `    // Marquer également le coursier comme occupé\n` +
          `    const { error: courierError } = await supabase\n` +
          `      .from('couriers')\n` +
          `      .update({ status: 'En livraison' })\n` +
          `      .eq('id', courierId);\n\n` +
          `    if (courierError) throw courierError;\n\n` +
          `    return { success: true, order: orderData, error: null };\n` +
          `  } catch (error: any) {\n` +
          `    console.error('Erreur assignation:', error.message || error);\n` +
          `    return { success: false, order: null, error: error.message || error };\n` +
          `  }\n` +
          `}\n`;

        fallbackData.manual = `[BLOCK_MANUAL_MARKDOWN]\n` +
          `# 📋 Manuel d'Utilisation - Suivi des Livraisons Resto-Livr\n\n` +
          `Bienvenue dans le guide d'utilisation de votre module d'administration de livraison de repas pour **Resto-Livr (Jean-Luc K.)** sur ARTISAN_OS.\n\n` +
          `## 🎯 Objectif du Module\n` +
          `Ce module vous permet de centraliser la gestion de vos livraisons de repas à Abidjan. Il automatise la mise en relation sécurisée entre les restaurants partenaires qui reçoivent les commandes et vos coursiers disponibles pour assurer le transport dans les meilleurs délais.\n\n` +
          `--- \n\n` +
          `## 🚀 Étapes pas-à-pas pour l'utilisation des actions\n\n` +
          `### 1. Consulter les Commandes en Attente\n` +
          `Chaque carte de livraison de l'interface affiche les détails essentiels d'une commande :\n` +
          `- **Statut** : Clignote en orange pour indiquer 'En attente' de prise en charge.\n` +
          `- **Informations Clients & Adresse** : Le nom du client et l'adresse précise de destination à Abidjan.\n` +
          `- **Détails Financiers & Restaurant** : Le nom de l'établissement partenaire et le montant total en Francs CFA (FCFA).\n\n` +
          `### 2. Assigner un coursier et initier le trajet\n` +
          `Pour déléguer un colis de repas à un coursier :\n` +
          `- **Étape 2a** : Cliquez sur le menu déroulant "*Assigner un Coursier Partenaire*".\n` +
          `- **Étape 2b** : Sélectionnez l'un des coursiers affichés comme "Disponible" (ex: Abdoulaye Touré, Koffi Kouamé).\n` +
          `- **Étape 2c** : Cliquez sur le grand bouton orange **Passer la livraison 'En cours'**.\n\n` +
          `### 3. Transition de statut\n` +
          `Dès validation, l'automate d'ARTISAN_OS passera la commande au statut **'En cours'** de manière instantanée, bloquera le coursier sélectionné pour ne pas lui réassigner d'autres tâches en simultané, et notifiera le client.\n\n` +
          `--- \n\n` +
          `## 📞 Support technique\n` +
          `Une question technique ? Une anomalie sur les webhooks de synchronisation ?\n` +
          `- **E-mail direct de support** : **support@handcode.ci**\n` +
          `- **Équipe** : Direction Technique handCode & ARTISAN_OS`;
      } else if (isEcommerce) {
        fallbackData.sql = `[BLOCK_SQL]\n` +
          `-- =========================================================\n` +
          `-- SCHÉMA SQL - E-COMMERCE & SYNCHRO INVENTAIRE (KIRA)\n` +
          `-- =========================================================\n\n` +
          `CREATE TABLE public.products (\n` +
          `    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n` +
          `    title TEXT NOT NULL,\n` +
          `    sku TEXT UNIQUE NOT NULL,\n` +
          `    quantity INT NOT NULL DEFAULT 0 CHECK (quantity >= 0),\n` +
          `    price NUMERIC NOT NULL DEFAULT 0 CHECK (price >= 0),\n` +
          `    category TEXT,\n` +
          `    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL\n` +
          `);\n\n` +
          `CREATE TABLE public.sales_channels (\n` +
          `    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n` +
          `    name TEXT NOT NULL, -- e.g. 'Boutique Lomé Central', 'E-shop'\n` +
          `    location TEXT\n` +
          `);\n\n` +
          `CREATE TABLE public.stock_movements (\n` +
          `    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n` +
          `    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,\n` +
          `    channel_id UUID REFERENCES public.sales_channels(id),\n` +
          `    quantity_changed INT NOT NULL,\n` +
          `    type TEXT NOT NULL CHECK (type IN ('Sale', 'Restock', 'Transfer')),\n` +
          `    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL\n` +
          `);\n`;

        fallbackData.ui = `[BLOCK_REACT]\n` +
          `import React, { useState } from 'react';\n` +
          `import { Package, ShieldAlert, Check, RefreshCcw, ShoppingBag } from 'lucide-react';\n\n` +
          `export default function InventorySync({ product, channels, onSyncInventory }) {\n` +
          `  const [qty, setQty] = useState(product.quantity);\n` +
          `  const [loading, setLoading] = useState(false);\n\n` +
          `  const executeSync = async () => {\n` +
          `    setLoading(true);\n` +
          `    try {\n` +
          `      await onSyncInventory(product.id, qty);\n` +
          `    } catch (e) { \n` +
          `      console.error(e);\n` +
          `    } finally {\n` +
          `      setLoading(false);\n` +
          `    }\n` +
          `  };\n\n` +
          `  return (\n` +
          `    <div className="p-5 bg-[#0e1017] rounded-xl border border-white/5 text-white max-w-sm font-sans shadow-lg">\n` +
          `      <div className="flex items-center gap-2 mb-3">\n` +
          `        <Package className="h-5 w-5 text-cyan-400" />\n` +
          `        <h4 className="font-bold text-sm tracking-wide">{product.title}</h4>\n` +
          `      </div>\n` +
          `      <div className="text-xs text-slate-400 mb-4 font-mono">SKU: {product.sku} | Catégorie: {product.category}</div>\n` +
          `      <div className="space-y-3">\n` +
          `        <label className="text-[11px] uppercase tracking-wider text-slate-400 block font-bold">Ajuster la quantité physique réelle :</label>\n` +
          `        <input type="number" value={qty} onChange={(e) => setQty(parseInt(e.target.value) || 0)} className="w-full bg-black border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-cyan-500" />\n` +
          `        <button onClick={executeSync} disabled={loading} className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 font-bold rounded-lg text-black text-xs transition-colors cursor-pointer">\n` +
          `          Synchroniser les stocks\n` +
          `        </button>\n` +
          `      </div>\n` +
          `    </div>\n` +
          `  );\n` +
          `}\n`;

        fallbackData.api = `[BLOCK_API]\n` +
          `import { createClient } from '@supabase/supabase-js';\n\n` +
          `const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_ANON_KEY || '');\n\n` +
          `export async function updateProductStock(productId: string, newQty: number) {\n` +
          `  try {\n` +
          `    const { data, error } = await supabase.from('products').update({ quantity: newQty, updated_at: new Date() }).eq('id', productId).select();\n` +
          `    if (error) throw error;\n` +
          `    return { data, error: null };\n` +
          `  } catch (err: any) {\n` +
          `    console.error('Erreur updateProductStock:', err.message || err);\n` +
          `    return { data: null, error: err.message || err };\n` +
          `  }\n` +
          `}\n`;

        fallbackData.manual = `[BLOCK_MANUAL_MARKDOWN]\n` +
          `# 📦 Manuel d'Utilisation - E-Commerce Stock Sync (Kira)\n\n` +
          `Manuel de prise en main destiné à l'équipe logistique de **Kira E-commerce** pour synchroniser les stocks.\n\n` +
          `## 🎯 Objectif du Module\n` +
          `Ce module assure une cohérence parfaite entre vos points de vente physiques à Lomé et votre boutique en ligne (E-shop). Il permet de mettre à jour le stock résiduel en temps réel et prévient les ruptures de stock accidentelles.\n\n` +
          `## 🚀 Étapes pas-à-pas d'utilisation\n\n` +
          `1. **Consulter l'article** : Visualisez l'intitulé du produit ainsi que son SKU et sa catégorie.\n` +
          `2. **Corriger la quantité** : Saisissez la valeur réelle dénombrée dans les rayons dans le champ de saisie numérique.\n` +
          `3. **Synchroniser** : Cliquez sur le bouton bleu **Synchroniser les stocks**. L'application repoussera les informations sur Supabase de manière sécurisée.\n\n` +
          `## 📞 Support\n` +
          `Pour toute assistance, contactez-nous à **support@handcode.ci** (handCode Team).`;
      } else if (isCrm) {
        fallbackData.sql = `[BLOCK_SQL]\n` +
          `-- =========================================================\n` +
          `-- SCHÉMA SQL - AUTOMATISATION PIPELINE LEAD CRM\n` +
          `-- =========================================================\n\n` +
          `CREATE TABLE public.crm_leads (\n` +
          `    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n` +
          `    contact_name TEXT NOT NULL,\n` +
          `    company_name TEXT,\n` +
          `    budget NUMERIC DEFAULT 0,\n` +
          `    stage TEXT DEFAULT 'Nouveau' CHECK (stage IN ('Nouveau', 'Qualifié', 'Proposition', 'Gagné', 'Perdu')),\n` +
          `    notes TEXT,\n` +
          `    assigned_to TEXT DEFAULT 'Unassigned',\n` +
          `    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL\n` +
          `);\n`;

        fallbackData.ui = `[BLOCK_REACT]\n` +
          `import React, { useState } from 'react';\n` +
          `import { User, ClipboardList, TrendingUp } from 'lucide-react';\n\n` +
          `export default function LeadStageControl({ lead, onUpdateStage }) {\n` +
          `  return (\n` +
          `    <div className="p-4 bg-[#0a0f0d] border border-white/10 rounded-xl max-w-sm text-xs font-sans text-white shadow-lg">\n` +
          `      <h4 className="font-bold text-sm mb-1">{lead.contact_name} ({lead.company_name})</h4>\n` +
          `      <div className="font-mono text-emerald-400 font-bold mb-4">{lead.budget.toLocaleString()} FCFA</div>\n` +
          `      <select onChange={(e) => onUpdateStage(lead.id, e.target.value)} value={lead.stage} className="w-full bg-black border border-white/10 p-2.5 rounded text-white text-xs cursor-pointer outline-none focus:border-emerald-500">\n` +
          `        <option value="Nouveau">Nouveau</option>\n` +
          `        <option value="Qualifié">Qualifié</option>\n` +
          `        <option value="Proposition">Proposition</option>\n` +
          `        <option value="Gagné">Gagné</option>\n` +
          `      </select>\n` +
          `    </div>\n` +
          `  );\n` +
          `}\n`;

        fallbackData.api = `[BLOCK_API]\n` +
          `import { createClient } from '@supabase/supabase-js';\n\n` +
          `const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_ANON_KEY || '');\n\n` +
          `export async function updateLeadStage(leadId: string, nextStage: string) {\n` +
          `  try {\n` +
          `    const { data, error } = await supabase.from('crm_leads').update({ stage: nextStage }).eq('id', leadId).select();\n` +
          `    if (error) throw error;\n` +
          `    return { data, error: null };\n` +
          `  } catch (err: any) {\n` +
          `    console.error('Erreur updateLeadStage:', err.message || err);\n` +
          `    return { data: null, error: err.message || err };\n` +
          `  }\n` +
          `}\n`;

        fallbackData.manual = `[BLOCK_MANUAL_MARKDOWN]\n` +
          `# 📊 Manuel d'Utilisation - Suivi Pipeline CRM\n\n` +
          `Guide d'utilisation de l'administration commerciale de vos opportunités d'affaires.\n\n` +
          `## 🎯 Objectif du Module\n` +
          `Faciliter le suivi rigoureux et la progression de vos prospects (leads) à chaque étape du parcours de vente (du premier contact "Nouveau" jusqu'à la conclusion "Gagné").\n\n` +
          `## 🚀 Étapes d'utilisation\n\n` +
          `1. **Analyser l'Opp** : Consultez le nom du contact, de l'entreprise et l'estimation budgétaire en FCFA.\n` +
          `2. **Faire progresser le lead** : Sélectionnez la nouvelle étape correspondante dans la liste de sélection de l'interface.\n` +
          `3. **Validation** : Le système synchronise instantanément la modification avec votre base de données Supabase.\n\n` +
          `## 📞 Support\n` +
          `Pour toute question relative aux processus de vente sur ARTISAN_OS : **support@handcode.ci**`;
      } else {
        // Generic customized scaffold based on words in their custom prompt
        const words = prompt.match(/\b\w{4,12}\b/g) || ["tasks", "items"];
        const sanitizedWords = Array.from(new Set(words.map(w => w.toLowerCase()).filter(w => !['avec', 'dans', 'pour', 'tout', 'base', 'donnees', 'comme', 'plus', 'faire', 'creation', 'modele', 'table', 'code', 'react', 'tailwind'].includes(w))));
        const primaryEntity = sanitizedWords[0] || 'records';
        const secondaryEntity = sanitizedWords[1] || 'categories';

        fallbackData.sql = `[BLOCK_SQL]\n` +
          `-- =========================================================\n` +
          `-- SCHÉMA SQL AUTO-ÉCHAFAUDÉ (PROJET MULTI-TABLES)\n` +
          `-- =========================================================\n\n` +
          `CREATE TABLE public.${primaryEntity} (\n` +
          `    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n` +
          `    title TEXT NOT NULL,\n` +
          `    description TEXT,\n` +
          `    status TEXT DEFAULT 'Actif' CHECK (status IN ('Actif', 'Inactif', 'Archivé')),\n` +
          `    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL\n` +
          `);\n\n` +
          `CREATE TABLE public.${secondaryEntity} (\n` +
          `    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n` +
          `    name TEXT NOT NULL UNIQUE,\n` +
          `    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL\n` +
          `);\n`;

        fallbackData.ui = `[BLOCK_REACT]\n` +
          `import React, { useState } from 'react';\n` +
          `import { Box, Settings, Layers, Star } from 'lucide-react';\n\n` +
          `export default function CustomAppControl({ record, onUpdateStatus }) {\n` +
          `  const [status, setStatus] = useState(record.status);\n` +
          `  return (\n` +
          `    <div className="p-4 bg-zinc-950 border border-white/5 rounded-xl max-w-sm text-xs font-sans text-white shadow-lg">\n` +
          `      <div className="flex items-center gap-1.5 mb-2">\n` +
          `        <Box className="text-orange-400 h-4 w-4" />\n` +
          `        <h4 className="font-bold text-sm uppercase">{record.title}</h4>\n` +
          `      </div>\n` +
          `      <p className="text-slate-400 mb-4">{record.description || 'Pas de description supplémentaire'}</p>\n` +
          `      <button onClick={() => onUpdateStatus(record.id, 'Archivé')} className="w-full py-2 bg-neutral-900 border border-white/10 text-white rounded text-xs hover:bg-neutral-800 transition-colors cursor-pointer">\n` +
          `        Archiver l'enregistrement\n` +
          `      </button>\n` +
          `    </div>\n` +
          `  );\n` +
          `}\n`;

        fallbackData.api = `[BLOCK_API]\n` +
          `import { createClient } from '@supabase/supabase-js';\n\n` +
          `const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_ANON_KEY || '');\n\n` +
          `export async function updateRecordStatus(recordId: string, nextStatus: string) {\n` +
          `  try {\n` +
          `    const { data, error } = await supabase.from('${primaryEntity}').update({ status: nextStatus }).eq('id', recordId).select();\n` +
          `    if (error) throw error;\n` +
          `    return { data, error: null };\n` +
          `  } catch (err: any) {\n` +
          `    console.error('Erreur updateRecordStatus:', err.message || err);\n` +
          `    return { data: null, error: err.message || err };\n` +
          `  }\n` +
          `}\n`;

        fallbackData.manual = `[BLOCK_MANUAL_MARKDOWN]\n` +
          `# 📋 Manuel d'Utilisation - Architecture Métier Personnalisée\n\n` +
          `Votre module métier sur-mesure déployé dans ARTISAN_OS.\n\n` +
          `## 🎯 Objectif du Module\n` +
          `Ce module modélise et administre vos données associées à vos entités principales afin d'unifier la collecte et le traitement métier sur le terrain.\n\n` +
          `## 🚀 Guide d'Utilisation\n\n` +
          `1. **Consulter l'Enregistrement** : Parcourez les indicateurs graphiques et données de la fiche sélectionnée.\n` +
          `2. **Actions contextuelles** : Cliquez sur les triggers et boutons d'action instantanés pour mettre à jour ou archiver les données d'historisation.\n\n` +
          `## 📞 Support d'Agence\n` +
          `Soutien complet et assistance de l'équipe handCode : **support@handcode.ci**`;
      }

      res.status(200).json({ success: true, data: fallbackData });
    }
  });

  // 8. CRM Leads CRUD with Supabase & local memory fallback
  app.get("/api/leads", async (req: Request, res: Response) => {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("leads")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          console.warn("Supabase selection error (likely missing table):", error.message);
          return res.json({
            success: true,
            isFallback: true,
            warning: "La table 'leads' n'a pas été détectée dans Supabase. Veuillez exécuter le script SQL fourni dans l'éditeur de requêtes de Supabase. Chargement des données locales.",
            data: inMemoryLeads
          });
        }

        const mapped = data.map((d: any) => ({
          id: d.id,
          name: d.name,
          company: d.company,
          status: d.status,
          budget: Number(d.budget) || 0,
          description: d.description || "",
          createdAt: d.created_at
        }));

        return res.json({ success: true, isFallback: false, data: mapped });
      } catch (e: any) {
        console.error("Supabase lookup exception:", e);
        return res.json({
          success: true,
          isFallback: true,
          warning: "Accès Supabase indisponible. Chargement des données locales.",
          data: inMemoryLeads
        });
      }
    } else {
      return res.json({
        success: true,
        isFallback: true,
        warning: "Variables d'environnement Supabase manquantes dans les secrets (SUPABASE_URL / SUPABASE_ANON_KEY). Simulation locale active.",
        data: inMemoryLeads
      });
    }
  });

  app.post("/api/leads", async (req: Request, res: Response) => {
    const { name, company, status, budget, description } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Le nom du prospect est obligatoire." });
    }

    const supabase = getSupabase();
    if (supabase) {
      try {
        const dbPayload = {
          name,
          company: company || null,
          status: status || "À revoir",
          budget: Number(budget) || 0,
          description: description || ""
        };

        const { data, error } = await supabase
          .from("leads")
          .insert([dbPayload])
          .select();

        if (error) {
          console.error("Supabase insert error:", error);
          return res.status(500).json({ error: "Erreur d'insertion Supabase : " + error.message });
        }

        const inserted = data[0];
        const mapped = {
          id: inserted.id,
          name: inserted.name,
          company: inserted.company,
          status: inserted.status,
          budget: Number(inserted.budget) || 0,
          description: inserted.description,
          createdAt: inserted.created_at
        };

        return res.json({ success: true, isFallback: false, data: mapped });
      } catch (e: any) {
        console.error("Supabase insert exception:", e);
        return res.status(500).json({ error: "Erreur serveur lors de l'accès Supabase" });
      }
    } else {
      // Create local fallback
      const newLead = {
        id: "mem-" + Date.now().toString(),
        name,
        company: company || null,
        status: status || "À revoir",
        budget: Number(budget) || 0,
        description: description || "",
        createdAt: new Date().toISOString()
      };
      inMemoryLeads = [newLead, ...inMemoryLeads];
      return res.json({ success: true, isFallback: true, data: newLead });
    }
  });

  app.put("/api/leads/:id", async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, company, status, budget, description } = req.body;

    const supabase = getSupabase();
    if (supabase) {
      try {
        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (company !== undefined) updateData.company = company;
        if (status !== undefined) updateData.status = status;
        if (budget !== undefined) updateData.budget = Number(budget);
        if (description !== undefined) updateData.description = description;

        // Try local lookup if it's a fallback ID
        if (id.startsWith("mem-")) {
          const idx = inMemoryLeads.findIndex(l => l.id === id);
          if (idx !== -1) {
            inMemoryLeads[idx] = { ...inMemoryLeads[idx], ...updateData };
            return res.json({ success: true, isFallback: true, data: inMemoryLeads[idx] });
          }
        }

        const { data, error } = await supabase
          .from("leads")
          .update(updateData)
          .eq("id", id)
          .select();

        if (error) {
          console.error("Supabase update error:", error);
          return res.status(500).json({ error: "Erreur de mise à jour Supabase : " + error.message });
        }

        if (!data || data.length === 0) {
          // Check fallback memory in case of hybrid tracking
          const idx = inMemoryLeads.findIndex(l => l.id === id);
          if (idx !== -1) {
            inMemoryLeads[idx] = { ...inMemoryLeads[idx], ...updateData };
            return res.json({ success: true, isFallback: true, data: inMemoryLeads[idx] });
          }
          return res.status(404).json({ error: "Lead non détecté" });
        }

        const updated = data[0];
        const mapped = {
          id: updated.id,
          name: updated.name,
          company: updated.company,
          status: updated.status,
          budget: Number(updated.budget) || 0,
          description: updated.description,
          createdAt: updated.created_at
        };

        return res.json({ success: true, isFallback: false, data: mapped });
      } catch (e: any) {
        console.error("Supabase update exception:", e);
        return res.status(500).json({ error: "Erreur lors de la mise à jour" });
      }
    } else {
      // Memory Fallback Update
      const idx = inMemoryLeads.findIndex(l => l.id === id);
      if (idx !== -1) {
        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (company !== undefined) updateData.company = company;
        if (status !== undefined) updateData.status = status;
        if (budget !== undefined) updateData.budget = Number(budget);
        if (description !== undefined) updateData.description = description;

        inMemoryLeads[idx] = { ...inMemoryLeads[idx], ...updateData };
        return res.json({ success: true, isFallback: true, data: inMemoryLeads[idx] });
      }
      return res.status(404).json({ error: "Lead local non trouvé" });
    }
  });

  app.delete("/api/leads/:id", async (req: Request, res: Response) => {
    const { id } = req.params;

    const supabase = getSupabase();
    if (supabase) {
      try {
        if (id.startsWith("mem-")) {
          inMemoryLeads = inMemoryLeads.filter(l => l.id !== id);
          return res.json({ success: true, isFallback: true });
        }

        const { error } = await supabase
          .from("leads")
          .delete()
          .eq("id", id);

        if (error) {
          console.error("Supabase delete error:", error);
          return res.status(500).json({ error: "Erreur de suppression Supabase : " + error.message });
        }

        inMemoryLeads = inMemoryLeads.filter(l => l.id !== id);
        return res.json({ success: true, isFallback: false });
      } catch (e: any) {
        console.error("Supabase deletion exception:", e);
        return res.status(500).json({ error: "Erreur lors de la suppression sur Supabase" });
      }
    } else {
      inMemoryLeads = inMemoryLeads.filter(l => l.id !== id);
      return res.json({ success: true, isFallback: true });
    }
  });


  // --- Vite & Production Assets Serving ---

  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in development mode with Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in production mode, serving dist static assets...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
