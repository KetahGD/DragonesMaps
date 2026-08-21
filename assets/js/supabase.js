import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.112.3/+esm";

const SUPABASE_URL = "https://tzojgppvusiygklbzrfy.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_vLWh91H1Ceo9eW3vDkEgvg_V9H5opOC";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

export { supabase, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY };
