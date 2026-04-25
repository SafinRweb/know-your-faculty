import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin as supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as any;
  if (!session || user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { adminId } = await req.json();

  // Prevent deleting all admins
  const { count } = await supabase
    .from("admin_credentials")
    .select("*", { count: "exact", head: true });

  if ((count ?? 0) <= 1) {
    return NextResponse.json(
      { error: "Cannot delete the last admin account." },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("admin_credentials")
    .delete()
    .eq("id", adminId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
