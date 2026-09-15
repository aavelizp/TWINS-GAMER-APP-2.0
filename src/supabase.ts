import { createClient } from '@supabase/supabase-js';

// Forzamos a TypeScript a reconocer que estas variables sí existen
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseKey) {
  console.error('Faltan las credenciales en el archivo .env');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
