import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin as supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
    const session = await auth();
    const user = session?.user as any;
    if (!session || user?.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reportId, action } = await req.json();

    await supabase
        .from("reports")
        .update({ status: action })
        .eq("id", reportId);

    if (action === "actioned") {
        const { data: report } = await supabase
            .from("reports")
            .select("post_id")
            .eq("id", reportId)
            .single();

        if (report?.post_id) {
            await supabase
                .from("feed_posts")
                .update({ status: "removed" })
                .eq("id", report.post_id);
        }
    }

    return NextResponse.json({ success: true });
}