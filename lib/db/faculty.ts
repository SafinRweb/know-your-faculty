import { supabaseAdmin as supabase } from "@/lib/supabase";
import { Faculty, FacultyAnalytics, Review } from "@/types";

export async function getAllFaculty(): Promise<Faculty[]> {
  const { data, error } = await supabase
    .from("faculty")
    .select("*")
    .eq("is_active", true)
    .order("department")
    .order("name");

  if (error) throw error;
  return data;
}

export async function searchFaculty(query: string): Promise<Faculty[]> {
  const { data, error } = await supabase
    .from("faculty")
    .select("*")
    .eq("is_active", true)
    .or(
      `name.ilike.%${query}%,department.ilike.%${query}%,initial.ilike.%${query}%`
    )
    .order("name");

  if (error) return [];
  return data;
}

export async function getFacultyById(id: string): Promise<Faculty | null> {
    const { data, error } = await supabase
        .from("faculty")
        .select("*")
        .eq("id", id)
        .single();

    if (error) return null;
    return data;
}

export async function getFacultyAnalytics(
  facultyId: string,
  semesterId?: string
): Promise<FacultyAnalytics[]> {
  let query = supabase
    .from("faculty_analytics")
    .select("*")
    .eq("faculty_id", facultyId);

  // Only filter by semester if one is explicitly selected
  // "All time" means no semester filter at all
  if (semesterId) {
    query = query.eq("semester_id", semesterId);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Analytics error:", error.message);
    return [];
  }
  return data ?? [];
}

export async function getFacultyReviews(
    facultyId: string,
    semesterId?: string
): Promise<Review[]> {
    let query = supabase
        .from("reviews")
        .select(`
      *,
      user:users(alias, avatar_color),
      answers:review_answers(
        *,
        question:review_questions(question_text, type)
      )
    `)
        .eq("faculty_id", facultyId)
        .eq("is_visible", true)
        .order("created_at", { ascending: false });

    if (semesterId) {
        query = query.eq("semester_id", semesterId);
    }

    const { data, error } = await query;
    if (error) return [];
    return data;
}

export async function getFacultyReviewCount(
    facultyId: string
): Promise<number> {
    const { count, error } = await supabase
        .from("reviews")
        .select("*", { count: "exact", head: true })
        .eq("faculty_id", facultyId)
        .eq("is_visible", true);

    if (error) return 0;
    return count ?? 0;
}