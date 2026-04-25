import { supabaseAdmin as supabase } from "@/lib/supabase";

export async function getFacultySections(facultyId: string) {
    const { data, error } = await supabase
        .from("sections")
        .select(`
      *,
      course:courses(code, title),
      semester:semesters(label, is_active)
    `)
        .eq("faculty_id", facultyId)
        .order("created_at", { ascending: false });

    if (error) return [];
    return data;
}