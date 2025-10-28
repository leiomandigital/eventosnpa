import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn('Variaveis VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY nao configuradas.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
