import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin as supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as any;
  if (!session || user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { action, id, data } = await req.json();

  if (action === "add") {
    const { error } = await supabase.from("contributors").insert({
      role: data.role,
      name: data.name,
      student_id: data.student_id || null,
      email: data.email || null,
      website: data.website || null,
      display_order: data.display_order || 99,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (action === "delete") {
    const { error } = await supabase
      .from("contributors")
      .delete()
      .eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (action === "update_version") {
    const { error } = await supabase
      .from("site_config")
      .upsert({ key: "version", value: data.version, updated_at: new Date().toISOString() });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
