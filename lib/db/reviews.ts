import { supabaseAdmin as supabase } from "@/lib/supabase";

export async function getUserReviewForFaculty(
  userId: string,
  facultyId: string
) {
  const { data, error } = await supabase
    .from("reviews")
    .select(`*, answers:review_answers(*, question:review_questions(*))`)
    .eq("user_id", userId)
    .eq("faculty_id", facultyId)
    .single();

  if (error) return null;
  return data;
}

export async function getActiveQuestions() {
  const { data, error } = await supabase
    .from("review_questions")
    .select("*")
    .eq("is_active", true)
    .order("display_order");

  if (error) return [];
  return data ?? [];
}