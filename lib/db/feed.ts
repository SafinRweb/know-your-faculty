import { supabaseAdmin as supabase } from "@/lib/supabase";

export async function getFeedPosts() {
  const { data, error } = await supabase
    .from("feed_posts")
    .select(`
      *,
      user:users!feed_posts_user_id_fkey(alias, avatar_color),
      admin:admins(display_name, avatar_color),
      replies:feed_replies(
        id, body, is_admin, created_at,
        user:users!feed_replies_user_id_fkey(alias, avatar_color),
        admin:admins(display_name, avatar_color)
      )
    `)
    .in("status", ["active", "resolved"])
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return [];
  return data;
}