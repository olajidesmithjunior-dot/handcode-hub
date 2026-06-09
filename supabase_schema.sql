-- Script de création de la table 'leads' pour Supabase SQL Editor
-- Projet : handCode CRM Hub (ARTISAN_OS)

-- 1. Création de la table 'leads'
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    company TEXT,
    status TEXT NOT NULL,
    budget NUMERIC DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Contrainte check pour limiter les statuts admissibles dans le pipeline
    CONSTRAINT check_status CHECK (status IN ('À revoir', 'Envoi Client', 'En Closing', 'Gagné'))
);

-- 2. Activation des politiques d'accès (RLS) - Rendre accessible en lecture/écriture publique ou selon votre auth
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Crée la politique pour autoriser toutes les opérations en mode anonyme / public si besoin de test rapide
CREATE POLICY "Autoriser accès public universel sur les leads" 
ON public.leads 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- 3. Ajout de commentaires d'aide à la maintenance
COMMENT ON TABLE public.leads IS 'Table de suivi des opportunités commerciales qualifiées de la centrale handCode';
COMMENT ON COLUMN public.leads.status IS 'Doit être obligatoire parmi les statuts définis : À revoir, Envoi Client, En Closing, Gagné';
