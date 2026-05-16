import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
    const session = await auth();
    const user = session?.user as any;

    if (!session || user?.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { postId } = await req.json();
        if (!postId) {
            return NextResponse.json({ error: "Missing postId" }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from("feed_posts")
            .delete()
            .eq("id", postId);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
