import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data } = await supabaseAdmin
    .from("users")
    .select("is_setup, alias, avatar_color")
    .eq("email", session.user.email)
    .single();

  if (!data) {
    return NextResponse.json({ isSetup: false });
  }

  return NextResponse.json({
    isSetup: data.is_setup,
    alias: data.alias,
    avatarColor: data.avatar_color,
  });
}
