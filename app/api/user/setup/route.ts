import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as any;
  const { alias, avatarColor } = await req.json();

  if (!alias || alias.length < 3) {
    return NextResponse.json({ error: "Alias too short" }, { status: 400 });
  }

  if (!/^[a-zA-Z0-9_]+$/.test(alias)) {
    return NextResponse.json({ error: "Invalid alias format" }, { status: 400 });
  }

  // Check alias is unique
  const { data: existing } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("alias", alias)
    .neq("id", user.id)
    .single();

  if (existing) {
    return NextResponse.json(
      { error: "This display name is already taken." },
      { status: 409 }
    );
  }

  const { error } = await supabaseAdmin
    .from("users")
    .update({
      alias,
      avatar_color: avatarColor,
      is_setup: true,
    })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
