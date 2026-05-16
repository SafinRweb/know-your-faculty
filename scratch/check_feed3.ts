import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

async function run() {
  const { data, error } = await supabase
    .from("feed_posts")
    .select(`
      *,
      user:users(alias, avatar_color),
      admin:admins(display_name, avatar_color),
      replies:feed_replies(
        id, body, is_admin, created_at,
        user:users(alias, avatar_color),
        admin:admins(display_name, avatar_color)
      )
    `)
    .in("status", ["active", "resolved"])
    .order("created_at", { ascending: false })
    .limit(50);
  console.log("Error:", error);
  console.log("Data length:", data?.length);
}
run();
