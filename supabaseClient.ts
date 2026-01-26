
import { createClient } from '@supabase/supabase-js';

/**
 * Cliente de Supabase configurado con la Anon Key.
 * La Anon Key es segura para su uso en el navegador.
 * URL del proyecto extraída del Project Ref del JWT: zddsaglknuryxronezdzp
 */

const supabaseUrl = 'https://zddsaglknuryxronezdzp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkZHNhZ2xrbnVyeHJvbmV6ZHpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0Mzc5NTMsImV4cCI6MjA4NTAxMzk1M30._ob0giV5-J6TCQUYlXoNvqRBsFR7Fradciq6Ujev_Lw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
