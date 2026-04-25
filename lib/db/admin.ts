import { supabaseAdmin as supabase } from "@/lib/supabase";

export async function getAdminStats() {
    const [faculty, reviews, users, posts, reports] = await Promise.all([
        supabase.from("faculty").select("*", { count: "exact", head: true }),
        supabase.from("reviews").select("*", { count: "exact", head: true }),
        supabase.from("users").select("*", { count: "exact", head: true }),
        supabase.from("feed_posts").select("*", { count: "exact", head: true }),
        supabase
            .from("reports")
            .select("*", { count: "exact", head: true })
            .eq("status", "pending"),
    ]);

    return {
        faculty: faculty.count ?? 0,
        reviews: reviews.count ?? 0,
        users: users.count ?? 0,
        posts: posts.count ?? 0,
        pendingReports: reports.count ?? 0,
    };
}

export async function getPendingReports() {
    const { data, error } = await supabase
        .from("reports")
        .select(`
      *,
      reporter:users!reporter_id(alias),
      post:feed_posts(id, body, status, user:users(alias))
    `)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

    if (error) return [];
    return data;
}

export async function getAllFacultyAdmin() {
    const { data, error } = await supabase
        .from("faculty")
        .select("*")
        .order("name");

    if (error) return [];
    return data;
}

export async function getAllUsers() {
    const { data, error } = await supabase
        .from("users")
        .select("id, email, alias, role, is_banned, is_setup, created_at")
        .order("created_at", { ascending: false })
        .limit(100);

    if (error) return [];
    return data;
}

export async function getAdminAccounts() {
    const { data, error } = await supabase
        .from("admin_credentials")
        .select("id, email, created_at")
        .order("created_at");

    if (error) return [];
    return data;
}

export async function getDepartments() {
  const { data, error } = await supabase
    .from("departments")
    .select("*")
    .order("name");
  if (error) return [];
  return data;
}

export async function getContributorsAdmin() {
  const { data, error } = await supabase
    .from("contributors")
    .select("*")
    .order("display_order");
  if (error) return [];
  return data;
}

export async function getSiteConfigAdmin() {
  const { data, error } = await supabase
    .from("site_config")
    .select("*");
  if (error) return {};
  return Object.fromEntries((data || []).map((r) => [r.key, r.value]));
}