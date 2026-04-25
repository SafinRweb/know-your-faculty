import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin as supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as any;
  const { postId, body } = await req.json();

  if (!body?.trim() || body.trim().length < 2) {
    return NextResponse.json({ error: "Reply too short." }, { status: 400 });
  }

  const isAdmin = user.role === "admin";

  const { data, error } = await supabase
    .from("feed_replies")
    .insert({
      post_id: postId,
      user_id: isAdmin ? null : user.id,
      admin_id: isAdmin ? user.id : null,  // ← real UUID
      is_admin: isAdmin,
      body: body.trim(),
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, id: data.id });
}
