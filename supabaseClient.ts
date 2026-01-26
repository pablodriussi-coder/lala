
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zddsaglknurxronezdzp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkZHNhZ2xrbnVyeHJvbmV6ZHpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0Mzc5NTMsImV4cCI6MjA4NTAxMzk1M30._ob0giV5-J6TCQUYlXoNvqRBsFR7Fradciq6Ujev_Lw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
