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

const DEFAULT_PRAXIS_SUPABASE_URL = 'https://chrtrfyynnbgxtysrzjo.supabase.co';
const DEFAULT_PRAXIS_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNocnRyZnl5bm5iZ3h0eXNyempvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3NzUxMTQsImV4cCI6MjEwNjM1MTExNH0.AzZqCXhS1r38ZFlXkkQeWYzwLwLct4a6Q05axno16tU';

// Client singleton Supabase officiel (garanti sans crash avec URL de production)
const safeUrl = isValidHttpUrl(rawUrl) ? rawUrl : DEFAULT_PRAXIS_SUPABASE_URL;
const safeKey = isValidPublishableKey(rawKey) ? rawKey : DEFAULT_PRAXIS_ANON_KEY;

export const isSupabaseConfigured = true;

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
