
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zddsaglknurxronezdzp.supabase.co';
const SUPABASE_ANON_KEY = 'sb_secret_z1F50dBwLbtPZirWZ8WKUg_Uh9Lzg86';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
