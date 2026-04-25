import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin as supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as any;
  if (!session || user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { adminId, newPassword } = await req.json();

  if (!newPassword || newPassword.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters." },
      { status: 400 }
    );
  }

  const { error } = await supabase.rpc("update_admin_password", {
    p_id: adminId,
    p_password: newPassword,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
