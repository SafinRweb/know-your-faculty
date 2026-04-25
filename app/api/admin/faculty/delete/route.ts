import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin as supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as any;
  if (!session || user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { facultyId } = await req.json();

  const { error } = await supabase
    .from("faculty")
    .delete()
    .eq("id", facultyId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
