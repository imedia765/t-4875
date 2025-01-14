import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://trzaeinxlytyqxptkuyj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyemFlaW54bHl0eXF4cHRrdXlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM4OTU3OTcsImV4cCI6MjA0OTQ3MTc5N30.RSh50RC3Vc29U0Xrxn_qDQgeUtH2sEi8JhGIdo1F7jU";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'Content-Type': 'application/json'
    }
  },
  db: {
    schema: 'public'
  }
});

// Add error handling helper
export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error);
  if (error.code === 'PGRST116') {
    return null; // Handle no rows found
  }
  throw error;
};