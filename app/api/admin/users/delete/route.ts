import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin as supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
    const session = await auth();
    const currentUser = session?.user as any;
    
    if (!session || currentUser?.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { userId } = await req.json();
        
        if (!userId) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        // Make sure admin isn't deleting themselves
        if (userId === currentUser.id) {
            return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
        }

        // Delete user (cascade will handle reviews/feed_posts if set up, 
        // but if not, we should probably delete them manually or let supabase cascade)
        const { error } = await supabase
            .from("users")
            .delete()
            .eq("id", userId);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
