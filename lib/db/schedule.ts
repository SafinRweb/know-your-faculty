import { supabaseAdmin as supabase } from "@/lib/supabase";

export async function getAllSections(semesterId?: string) {
  let q = supabase
    .from("sections")
    .select(`
      *,
      course:courses(code, title),
      faculty:faculty(id, name, department, initial),
      semester:semesters(label, is_active)
    `)
    .order("course_id");

  if (semesterId) {
    q = q.eq("semester_id", semesterId);
  }

  const { data, error } = await q.limit(2000);
  if (error) return [];
  return data;
}

export async function searchSections(query: string, semesterId?: string) {
  let q = supabase
    .from("sections")
    .select(`
      *,
      course:courses(code, title),
      faculty:faculty(id, name, department, initial),
      semester:semesters(label, is_active)
    `)
    .order("course_id");

  if (semesterId) {
    q = q.eq("semester_id", semesterId);
  }

  const { data, error } = await q.limit(2000);
  if (error) return [];
  return data;
}