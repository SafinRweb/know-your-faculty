import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const body = await req.json();
    const { facultyId, semesterId, answers } = body;

    if (!facultyId || !answers || typeof answers !== "object") {
        return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Check if review already exists
    const { data: existing } = await supabaseAdmin
        .from("reviews")
        .select("id")
        .eq("user_id", user.id)
        .eq("faculty_id", facultyId)
        .single();

    let reviewId: string;

    if (existing) {
        // Update existing review
        const { error } = await supabaseAdmin
            .from("reviews")
            .update({ semester_id: semesterId || null, updated_at: new Date().toISOString() })
            .eq("id", existing.id);

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        reviewId = existing.id;

        // Delete old answers
        await supabaseAdmin.from("review_answers").delete().eq("review_id", reviewId);
    } else {
        // Insert new review
        const { data, error } = await supabaseAdmin
            .from("reviews")
            .insert({
                user_id: user.id,
                faculty_id: facultyId,
                semester_id: semesterId || null,
            })
            .select("id")
            .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        reviewId = data.id;
    }

    // Insert answers
    const answerRows = Object.entries(answers).map(([questionId, value]) => ({
        review_id: reviewId,
        question_id: questionId,
        answer_value: value as string,
    }));

    const { error: answerError } = await supabaseAdmin
        .from("review_answers")
        .insert(answerRows);

    if (answerError) {
        return NextResponse.json({ error: answerError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, reviewId });
}