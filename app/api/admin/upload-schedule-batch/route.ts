export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin as supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as any;
  if (!session || user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { sections } = await req.json();
    if (!sections || !Array.isArray(sections)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    if (sections.length > 0) {
        const { error: insertError } = await supabase
            .from("sections")
            .insert(sections);
        if (insertError) throw new Error(insertError.message);
    }

    return NextResponse.json({ success: true, count: sections.length });
  } catch (err: any) {
    console.error("Batch insert error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
