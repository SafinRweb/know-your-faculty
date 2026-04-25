import { supabaseAdmin as supabase } from "@/lib/supabase";
import { Semester } from "@/types";

export async function getActiveSemester(): Promise<Semester | null> {
    const { data, error } = await supabase
        .from("semesters")
        .select("*")
        .eq("is_active", true)
        .single();

    if (error) return null;
    return data;
}

export async function getAllSemesters(): Promise<Semester[]> {
    const { data, error } = await supabase
        .from("semesters")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) return [];
    return data;
}