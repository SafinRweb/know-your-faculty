import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Public client — subject to RLS (for client-side use)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side admin client — bypasses RLS (for auth callbacks, API routes)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
    global: { 
        fetch: (url, options) => fetch(url, { 
            ...options, 
            cache: "no-store",
            // @ts-ignore - Next.js specific fetch option
            next: { revalidate: 0 }
        })
    }
});