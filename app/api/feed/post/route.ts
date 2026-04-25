import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin as supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as any;
  const { body } = await req.json();

  if (!body?.trim() || body.trim().length < 10) {
    return NextResponse.json(
      { error: "Post must be at least 10 characters." },
      { status: 400 }
    );
  }

  if (body.trim().length > 500) {
    return NextResponse.json(
      { error: "Post cannot exceed 500 characters." },
      { status: 400 }
    );
  }

  const isAdmin = user.role === "admin";

  const { data, error } = await supabase
    .from("feed_posts")
    .insert({
      user_id: isAdmin ? null : user.id,
      admin_id: isAdmin ? user.id : null,  // ← real UUID
      body: body.trim(),
      status: "active",
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, id: data.id });
}