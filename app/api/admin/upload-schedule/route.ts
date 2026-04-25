export const runtime = "nodejs";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin as supabase } from "@/lib/supabase";
import { parseSchedulePDF } from "@/lib/pdfParser";

function normalizeDepartment(courseCode: string): string {
  const prefix = courseCode.match(/^([A-Z]+)/)?.[1] || "TBD";
  
  const deptMap: Record<string, string> = {
    // BBA cluster
    "BUS": "BBA", "ACT": "BBA", "MGT": "BBA",
    "MKT": "BBA", "HRM": "BBA", "FIN": "BBA",
    "ACC": "BBA", "MIS": "BBA", "BAD": "BBA",
    "BBA": "BBA",
    // CSE cluster  
    "CSE": "CSE", "SWE": "CSE",
    // EEE cluster
    "EEE": "EEE", "ECE": "EEE",
    // Others
    "ENG": "ENG", "ENGL": "ENG",
    "MAT": "MAT", "PHY": "PHY",
    "GEB": "GEB", "ICE": "ICE",
    "CEE": "CEE", "ARC": "ARC",
  };

  return deptMap[prefix] || prefix;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as any;
  if (!session || user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("pdf") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No PDF uploaded." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse PDF — semester auto-detected inside
    const parsed = await parseSchedulePDF(buffer);
    console.log("Semester detected:", parsed.semester);
    console.log("Sections parsed:", parsed.sections.length);
    console.log("First 3 sections:", JSON.stringify(parsed.sections.slice(0, 3), null, 2));
    const semesterLabel = parsed.semester;

    // 1. Create or get semester
    let semesterId: string;
    const { data: existingSem } = await supabase
      .from("semesters")
      .select("id")
      .eq("label", semesterLabel)
      .single();

    if (existingSem) {
      semesterId = existingSem.id;
    } else {
      // Deactivate all current semesters
      await supabase
        .from("semesters")
        .update({ is_active: false })
        .eq("is_active", true);

      const { data: newSem, error: semError } = await supabase
        .from("semesters")
        .insert({ label: semesterLabel, is_active: true })
        .select("id")
        .single();

      if (semError) throw new Error(semError.message);
      semesterId = newSem.id;
    }

    // 2. Ensure TBA faculty exists
    const { data: tbaFaculty } = await supabase
      .from("faculty")
      .select("id")
      .eq("initial", "TBA")
      .single();

    if (!tbaFaculty) {
      await supabase.from("faculty").insert({
        name: "TBA",
        department: "TBD",
        initial: "TBA",
        is_active: true,
      });
    }

    // 3. Get all faculty indexed by initial
    const { data: allFaculty } = await supabase
      .from("faculty")
      .select("id, initial");

    const facultyByInitial: Record<string, string> = {};
    for (const f of allFaculty || []) {
      if (f.initial) facultyByInitial[f.initial.toUpperCase()] = f.id;
    }

    // 4. Auto-create missing faculty
    const missingInitials = parsed.faculty_initials.filter(
      (i) => !facultyByInitial[i.toUpperCase()]
    );

    if (missingInitials.length > 0) {
      // Build a map of initial -> department from sections
      const initialDeptMap: Record<string, string> = {};
      for (const s of parsed.sections) {
        if (!initialDeptMap[s.faculty_initial]) {
          initialDeptMap[s.faculty_initial] = normalizeDepartment(s.course_code);
        }
      }

      const { data: created } = await supabase
        .from("faculty")
        .insert(
          missingInitials.map((initial) => ({
            name: initial,
            department: initialDeptMap[initial.toUpperCase()] || "TBD",
            initial: initial.toUpperCase(),
            is_active: true,
          }))
        )
        .select("id, initial");

      for (const f of created || []) {
        if (f.initial) facultyByInitial[f.initial.toUpperCase()] = f.id;
      }
    }

    // 5. Get all courses indexed by code
    const { data: allCourses } = await supabase
      .from("courses")
      .select("id, code");

    const courseByCode: Record<string, string> = {};
    for (const c of allCourses || []) {
      courseByCode[c.code] = c.id;
    }

    // 6. Auto-create missing courses
    const uniqueCodes = [
      ...new Set(parsed.sections.map((s) => s.course_code)),
    ];
    const missingCodes = uniqueCodes.filter((c) => !courseByCode[c]);

    if (missingCodes.length > 0) {
      const { data: created } = await supabase
        .from("courses")
        .insert(missingCodes.map((code) => ({ code, title: code })))
        .select("id, code");

      for (const c of created || []) {
        courseByCode[c.code] = c.id;
      }
    }

    // 7. Delete old sections for this semester
    await supabase
      .from("sections")
      .delete()
      .eq("semester_id", semesterId);

    // 8. Insert all rows in batches of 500
    const sectionRows = parsed.sections
      .filter(
        (s) =>
          facultyByInitial[s.faculty_initial.toUpperCase()] &&
          courseByCode[s.course_code]
      )
      .map((s) => ({
        section_no: s.section_no,
        room: s.room,
        day_pattern: s.day_pattern,
        time_slot: s.time_slot,
        semester_id: semesterId,
        course_id: courseByCode[s.course_code],
        faculty_id: facultyByInitial[s.faculty_initial.toUpperCase()],
      }));

    // Batch insert 500 at a time
    const BATCH_SIZE = 500;
    for (let i = 0; i < sectionRows.length; i += BATCH_SIZE) {
      const batch = sectionRows.slice(i, i + BATCH_SIZE);
      const { error: insertError } = await supabase
        .from("sections")
        .insert(batch);
      if (insertError) throw new Error(insertError.message);
    }

    return NextResponse.json({
      success: true,
      semester: semesterLabel,
      sections_imported: sectionRows.length,
      faculty_created: missingInitials.length,
      courses_created: missingCodes.length,
      total_parsed: parsed.sections.length,
    });
  } catch (err: any) {
    console.error("PDF upload error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
