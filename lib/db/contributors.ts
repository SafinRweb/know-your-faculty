import { supabaseAdmin as supabase } from "@/lib/supabase";

export async function getContributors() {
  const { data, error } = await supabase
    .from("contributors")
    .select("*")
    .order("display_order");
  if (error) return [];
  return data;
}

export async function getSiteConfig() {
  const { data, error } = await supabase
    .from("site_config")
    .select("*");
  if (error) return {};
  return Object.fromEntries(data.map((r) => [r.key, r.value]));
}
