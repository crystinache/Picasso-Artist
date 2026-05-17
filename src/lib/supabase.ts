import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Pulizia dell'URL se termina con /rest/v1/
const cleanUrl = supabaseUrl?.replace(/\/rest\/v1\/?$/, '');

export const supabase = (cleanUrl && supabaseAnonKey) 
  ? createClient(cleanUrl, supabaseAnonKey) 
  : null;
