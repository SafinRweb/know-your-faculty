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
        // This will cascade delete review_answers, feed_posts, etc.
        const { error } = await supabase
            .from("reviews")
            .delete()
            .neq("id", "00000000-0000-0000-0000-000000000000"); // Hack to delete all rows
            
        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Also delete all anonymous users created by the importer
        // Their emails match %imported.knowyourfaculty.app
        const { error: userError } = await supabase
            .from("users")
            .delete()
            .like("email", "%@imported.knowyourfaculty.app");

        if (userError) {
            console.error("Failed to delete imported users:", userError);
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
