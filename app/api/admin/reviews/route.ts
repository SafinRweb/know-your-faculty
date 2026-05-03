import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin as supabase } from "@/lib/supabase";

// GET — list all reviews (with user alias, faculty name, semester, answers)
export async function GET(req: NextRequest) {
    const session = await auth();
    const user = session?.user as any;
    if (!session || user?.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const facultyId = searchParams.get("facultyId");

    let query = supabase
        .from("reviews")
        .select(`
            *,
            user:users(alias, email),
            faculty:faculty(name, department),
            semester:semesters(label),
            answers:review_answers(
                *,
                question:review_questions(question_text, type)
            )
        `)
        .order("created_at", { ascending: false })
        .limit(200);

    if (facultyId) {
        query = query.eq("faculty_id", facultyId);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ reviews: data });
}

// POST — admin actions on reviews (delete, toggle visibility)
export async function POST(req: NextRequest) {
    const session = await auth();
    const user = session?.user as any;
    if (!session || user?.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action, reviewId } = await req.json();

    if (!reviewId) {
        return NextResponse.json({ error: "Review ID required." }, { status: 400 });
    }

    if (action === "delete") {
        // Delete answers first (FK), then the review
        await supabase.from("review_answers").delete().eq("review_id", reviewId);
        const { error } = await supabase.from("reviews").delete().eq("id", reviewId);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true });
    }

    if (action === "hide") {
        const { error } = await supabase
            .from("reviews")
            .update({ is_visible: false })
            .eq("id", reviewId);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true });
    }

    if (action === "show") {
        const { error } = await supabase
            .from("reviews")
            .update({ is_visible: true })
            .eq("id", reviewId);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
