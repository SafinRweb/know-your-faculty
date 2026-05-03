import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

// Static question keys matching the ReviewWizard
const VALID_KEYS = ["course", "attendance", "grading", "teaching", "recommend", "comment"];

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

    // Ensure we have the static question rows in review_questions
    // (upsert by question_text so they exist for analytics/display)
    const questionMap: Record<string, string> = {};

    for (const key of VALID_KEYS) {
        if (answers[key] === undefined || answers[key] === "") continue;

        const questionText = getQuestionText(key);
        const questionType = key === "comment" ? "text" : key === "course" ? "text" : "mcq";
        const options = questionType === "mcq" ? ["Yes", "No"] : null;

        // Find or create the question row
        const { data: existingQ } = await supabaseAdmin
            .from("review_questions")
            .select("id")
            .eq("question_text", questionText)
            .single();

        if (existingQ) {
            questionMap[key] = existingQ.id;
        } else {
            const { data: newQ, error: qErr } = await supabaseAdmin
                .from("review_questions")
                .insert({
                    question_text: questionText,
                    type: questionType,
                    options,
                    display_order: getDisplayOrder(key),
                    is_active: true,
                })
                .select("id")
                .single();

            if (qErr) {
                console.error("Failed to create question:", qErr.message);
                continue;
            }
            questionMap[key] = newQ.id;
        }
    }

    // Insert answers
    const answerRows = Object.entries(questionMap).map(([key, questionId]) => ({
        review_id: reviewId,
        question_id: questionId,
        answer_value: answers[key] as string,
    }));

    if (answerRows.length > 0) {
        const { error: answerError } = await supabaseAdmin
            .from("review_answers")
            .insert(answerRows);

        if (answerError) {
            return NextResponse.json({ error: answerError.message }, { status: 500 });
        }
    }

    return NextResponse.json({ success: true, reviewId });
}

function getQuestionText(key: string): string {
    const map: Record<string, string> = {
        course: "Which course did you take with this faculty?",
        attendance: "Strict about attendance?",
        grading: "Fair grading?",
        teaching: "Clear teaching?",
        recommend: "Do you recommend this faculty?",
        comment: "Additional comments",
    };
    return map[key] || key;
}

function getDisplayOrder(key: string): number {
    const order: Record<string, number> = {
        course: 1,
        attendance: 2,
        grading: 3,
        teaching: 4,
        recommend: 5,
        comment: 99,
    };
    return order[key] || 50;
}