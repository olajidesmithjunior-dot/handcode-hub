import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Lazily initialized Gemini AI Client
let aiClient: GoogleGenAI | null = null;

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
    try {
      const { topic, tone, brandIdentity } = req.body;
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
      console.error("Error generating social posts:", error);
      res.status(500).json({ error: error.message || "Erreur lors de la génération de posts" });
    }
  });

  // 2. Smart Snippet & Component Generator
  app.post("/api/generate-code", async (req: Request, res: Response) => {
    try {
      const { prompt, language } = req.body;
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
      console.error("Error generating code snippet:", error);
      res.status(500).json({ error: error.message || "Erreur lors de la génération du snippet" });
    }
  });

  // 3. Landing Page UX Copywriter & SEO Builder
  app.post("/api/generate-copy", async (req: Request, res: Response) => {
    try {
      const { idea, brandIdentity } = req.body;
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
      console.error("Error generating copywriting plan:", error);
      res.status(500).json({ error: error.message || "Erreur lors de la génération de copywriting" });
    }
  });

  // 4. Design Asset & SVG Generator
  app.post("/api/generate-design", async (req: Request, res: Response) => {
    try {
      const { prompt, style, brandIdentity } = req.body;
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
      console.error("Error generating design assets:", error);
      res.status(500).json({ error: error.message || "Erreur lors de la génération de l'asset créatif" });
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
    try {
      const { answers, clientName, projectName, brandIdentity } = req.body;
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
      console.error("Error generating digital brief dossier:", error);
      res.status(500).json({ error: error.message || "Erreur de génération du brief dossier" });
    }
  });

  // 7. Dynamic AI Commercial Agent Qualification & Advisory
  app.post("/api/qualify-lead", async (req: Request, res: Response) => {
    try {
      const { name, company, problem, budgetFCFA, timelineWeeks, brandIdentity } = req.body;
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
      console.error("Error in AI qualification endpoint:", error);
      res.status(500).json({ error: error.message || "Erreur interne de qualification IA" });
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
