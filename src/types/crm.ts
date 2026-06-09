export type LeadStatus = 'À revoir' | 'Envoi Client' | 'En Closing' | 'Gagné';

export interface Lead {
  id: string; // UUID
  name: string;
  company: string | null;
  status: LeadStatus;
  budget: number; // Numeric budget in FCFA or EUR
  description: string;
  createdAt: string; // ISO DateTime string
}
