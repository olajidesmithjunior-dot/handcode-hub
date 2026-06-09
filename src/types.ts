export type ModuleType = 'social' | 'code' | 'copy' | 'design' | 'manychat' | 'brief' | 'saved' | 'commercial-agent' | 'pipeline';

export interface SocialPost {
  id: string;
  topic: string;
  tone: string;
  linkedin: string;
  twitter: string;
  instagram: string;
  createdAt: string;
}

export interface CodeSnippet {
  id: string;
  title: string;
  prompt: string;
  language: string;
  code: string;
  explanation: string;
  createdAt: string;
}

export interface LandingPageSection {
  title: string;
  content: string;
  ctaText?: string;
  tips?: string;
}

export interface CopySEOData {
  id: string;
  idea: string;
  hero: LandingPageSection;
  features: LandingPageSection[];
  cta: LandingPageSection;
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
  hooks: string[];
  createdAt: string;
}

export interface DesignAsset {
  id: string;
  prompt: string;
  style: string;
  palette: { hex: string; role: string }[];
  fontPairing: { header: string; body: string; description: string };
  midjourneyPrompt: string;
  svgIcon?: string; // Generated inline SVG icon
  createdAt: string;
}

export interface ManyChatConfig {
  id: string;
  persona: string;
  keywords: string;
  objective: string;
  ctaText: string;
  ctaUrl: string;
  addLeadCapture: boolean;
  createdAt: string;
}

export interface SavedItem {
  id: string;
  type: ModuleType;
  title: string;
  data: any;
  createdAt: string;
  status?: 'draft' | 'sent' | 'won' | 'lost'; // For Mini CRM / Pipeline de Briefs
}

export interface BrandIdentity {
  isActive: boolean;
  targetAudience: string;
  editorialTone: string;
  primaryColor: string;
  secondaryColor: string;
  keywords: string;
  brandPreset?: string;
}


