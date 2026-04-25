import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const { postId, reason } = await req.json();

    const { error } = await supabaseAdmin.from("reports").insert({
        reporter_id: user.id,
        post_id: postId,
        reason: reason || null,
        status: "pending",
    });

    if (error) {
        if (error.code === "23505") {
            return NextResponse.json(
                { error: "Already reported." },
                { status: 409 }
            );
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}