import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

async function run() {
  // 1. Rename "Developer" to "Founder and Developer"
  await supabase.from("contributors").update({ role: "Founder and Developer" }).eq("role", "Developer");

  // 2. Set the display order
  // Assuming "Founder and Developer" should be first (order 1)
  // and "Co Founder & Lead Data Curator" should be second (order 2)
  await supabase.from("contributors").update({ display_order: 1 }).eq("role", "Founder and Developer");
  await supabase.from("contributors").update({ display_order: 2 }).eq("role", "Co Founder & Lead Data Curator");

  console.log("Updated roles and display orders");
}
run();
