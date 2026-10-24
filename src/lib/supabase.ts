/// <reference types="vite/client" />
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const rawUrl = (((import.meta as any).env?.VITE_SUPABASE_URL || '') as string).trim();
const rawKey = (((import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '') as string).trim();

const isValidHttpUrl = (url: string): boolean => {
  if (!url || url.includes('[') || url.includes(']') || url.includes('your-project.supabase.co')) return false;
  return url.startsWith('https://') || url.startsWith('http://');
};

const isValidPublishableKey = (key: string): boolean => {
  if (!key || key.includes('[') || key.includes(']') || key.length < 10) return false;
  return true;
};

export const isSupabaseConfigured = isValidHttpUrl(rawUrl) && isValidPublishableKey(rawKey);

if (!isSupabaseConfigured && typeof window !== 'undefined') {
  console.info(
    '[Praxis Auth] Mode local actif (Supabase non configuré). ' +
    'Renseignez VITE_SUPABASE_URL et VITE_SUPABASE_PUBLISHABLE_KEY pour activer l’authentification cloud.'
  );
}

// Client singleton Supabase officiel (garanti sans crash avec URL de repli sûre)
const safeUrl = isValidHttpUrl(rawUrl) ? rawUrl : 'https://praxis-app.supabase.co';
const safeKey = isValidPublishableKey(rawKey) ? rawKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder';

export const supabase: SupabaseClient = createClient(
  safeUrl,
  safeKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'praxis-supabase-auth-token',
    },
  }
);

export interface UserProfile {
  id: string;
  role: 'teacher' | 'admin' | 'partner';
  full_name: string;
  email: string;
  phone_whatsapp?: string;
  school_name?: string;
  city?: string;
  country?: string;
  avatar_url?: string;
  referral_code?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserCreditBalance {
  teacher_id: string;
  free_credits: number;
  subscription_credits: number;
  purchased_credits: number;
  frozen_subscription_credits: number;
  total_available_credits: number;
  total_copies_corrected: number;
  last_updated_at?: string;
}

export interface UserSubscription {
  id: string;
  teacher_id: string;
  plan_id: 'free' | 'monthly' | '3_months' | '9_months';
  status: 'active' | 'expired' | 'canceled' | 'past_due';
  started_at: string;
  expires_at?: string | null;
  auto_renew: boolean;
}
