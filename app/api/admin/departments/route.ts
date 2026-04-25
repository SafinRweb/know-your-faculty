import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin as supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as any;
  if (!session || user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { action, name, id } = await req.json();

  if (action === "add") {
    if (!name?.trim()) {
      return NextResponse.json({ error: "Name required." }, { status: 400 });
    }
    const { error } = await supabase
      .from("departments")
      .insert({ name: name.trim().toUpperCase() });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (action === "delete") {
    const { error } = await supabase
      .from("departments")
      .delete()
      .eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
