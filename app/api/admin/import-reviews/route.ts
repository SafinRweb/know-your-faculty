import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin as supabase } from "@/lib/supabase";

// Anonymous name pools for generating unique reviewer aliases
const ADJECTIVES = [
    "Silent", "Brave", "Clever", "Swift", "Calm", "Bold", "Keen",
    "Wise", "Quick", "Bright", "Sharp", "Cool", "Chill", "Witty",
    "Sly", "Fierce", "Noble", "Mystic", "Hidden", "Lone",
    "Shadow", "Cosmic", "Neon", "Pixel", "Frost", "Storm",
    "Vivid", "Stark", "Dusk", "Dawn", "Amber", "Rusty",
    "Velvet", "Stealth", "Lunar", "Solar", "Astral", "Nimble",
    "Gentle", "Wild", "Iron", "Lucid", "Polar", "Hazy",
];

const NOUNS = [
    "Owl", "Fox", "Wolf", "Hawk", "Bear", "Lynx", "Sage",
    "Raven", "Tiger", "Panda", "Eagle", "Cobra", "Viper",
    "Falcon", "Otter", "Bison", "Crane", "Shark", "Moose",
    "Nomad", "Scout", "Rider", "Ghost", "Spark", "Blaze",
    "Comet", "Orbit", "Drift", "Shade", "Prism", "Quartz",
    "Cipher", "Dune", "Reef", "Peak", "Ridge", "Stone",
    "Fern", "Ivy", "Moss", "Thorn", "Cedar", "Maple",
];

const AVATAR_COLORS = [
    "#e8622c", "#3b82f6", "#10b981", "#8b5cf6", "#f59e0b",
    "#ef4444", "#06b6d4", "#ec4899", "#14b8a6", "#6366f1",
    "#d97706", "#84cc16", "#f97316", "#a855f7", "#22d3ee",
];

function generateAnonAlias(): string {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
    const num = Math.floor(1000 + Math.random() * 9000); // 4-digit suffix
    return `${adj}${noun}_${num}`;
}

function pickAvatarColor(): string {
    return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

async function createAnonymousUser(): Promise<string> {
    // Generate a unique alias (retry on collision)
    let alias = generateAnonAlias();
    let attempts = 0;
    while (attempts < 5) {
        const { data: clash } = await supabase
            .from("users")
            .select("id")
            .eq("alias", alias)
            .single();
        if (!clash) break;
        alias = generateAnonAlias();
        attempts++;
    }

    const uniqueId = crypto.randomUUID();
    const { data: newUser, error } = await supabase
        .from("users")
        .insert({
            email: `anon_${uniqueId}@imported.knowyourfaculty.app`,
            alias,
            role: "student",
            is_banned: false,
            is_setup: true,
            avatar_color: pickAvatarColor(),
        })
        .select("id")
        .single();

    if (error) throw new Error(`Failed to create anonymous user: ${error.message}`);
    return newUser.id;
}

// Map spreadsheet column headers to our question keys
const COLUMN_MAP: Record<string, { questionText: string; type: "mcq" | "text"; options: string[] | null; displayOrder: number }> = {
    "attendance": { questionText: "Strict about attendance?", type: "mcq", options: ["Yes", "No"], displayOrder: 2 },
    "grading": { questionText: "Fair grading?", type: "mcq", options: ["Yes", "No"], displayOrder: 3 },
    "teaching": { questionText: "Clear teaching?", type: "mcq", options: ["Yes", "No"], displayOrder: 4 },
    "recommend": { questionText: "Do you recommend this faculty?", type: "mcq", options: ["Yes", "Drop"], displayOrder: 5 },
    "comment": { questionText: "Additional comments", type: "text", options: null, displayOrder: 99 },
};

async function getOrCreateQuestion(key: string): Promise<string> {
    const config = COLUMN_MAP[key];
    if (!config) throw new Error(`Unknown question key: ${key}`);

    const { data: existing } = await supabase
        .from("review_questions")
        .select("id")
        .eq("question_text", config.questionText)
        .single();

    if (existing) return existing.id;

    const { data: newQ, error } = await supabase
        .from("review_questions")
        .insert({
            question_text: config.questionText,
            type: config.type,
            options: config.options,
            display_order: config.displayOrder,
            is_active: true,
        })
        .select("id")
        .single();

    if (error) throw new Error(`Failed to create question: ${error.message}`);
    return newQ.id;
}

function parseCSV(csvText: string): Record<string, string>[] {
    const lines = csvText.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) return [];

    // Parse header
    const headers = parseCSVLine(lines[0]).map((h) => h.trim());

    const rows: Record<string, string>[] = [];
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        const row: Record<string, string> = {};
        headers.forEach((h, j) => {
            row[h] = values[j]?.trim() || "";
        });
        rows.push(row);
    }
    return rows;
}

function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = "";
        } else {
            current += char;
        }
    }
    result.push(current);
    return result;
}

// Find the best header match for our expected columns
function mapHeaders(headers: string[]): Record<string, string> {
    const map: Record<string, string> = {};
    const lower = headers.map((h) => h.toLowerCase().trim());

    // Faculty Name
    const nameIdx = lower.findIndex((h) => h.includes("faculty") && h.includes("name"));
    if (nameIdx >= 0) map["facultyName"] = headers[nameIdx];

    // Initial
    const initIdx = lower.findIndex((h) => h === "initial" || h === "initials");
    if (initIdx >= 0) map["initial"] = headers[initIdx];

    // Department
    const deptIdx = lower.findIndex((h) => h.includes("department") || h === "dept");
    if (deptIdx >= 0) map["department"] = headers[deptIdx];


    // Course
    const courseIdx = lower.findIndex((h) => h.includes("course"));
    if (courseIdx >= 0) map["course"] = headers[courseIdx];

    // Attendance
    const attIdx = lower.findIndex((h) => h.includes("attendance"));
    if (attIdx >= 0) map["attendance"] = headers[attIdx];

    // Grading
    const gradeIdx = lower.findIndex((h) => h.includes("grading"));
    if (gradeIdx >= 0) map["grading"] = headers[gradeIdx];

    // Teaching
    const teachIdx = lower.findIndex((h) => h.includes("teaching"));
    if (teachIdx >= 0) map["teaching"] = headers[teachIdx];

    // Recommended (allow typo 'recomend')
    const recIdx = lower.findIndex((h) => h.includes("recommend") || h.includes("recomend"));
    if (recIdx >= 0) map["recommend"] = headers[recIdx];

    // Comment
    const comIdx = lower.findIndex((h) => h.includes("comment"));
    if (comIdx >= 0) map["comment"] = headers[comIdx];

    return map;
}

export async function POST(req: NextRequest) {
    // Auth check
    const session = await auth();
    const user = session?.user as any;
    if (!session || user?.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { csvContent } = await req.json();
        if (!csvContent || typeof csvContent !== "string") {
            return NextResponse.json({ error: "CSV content is required." }, { status: 400 });
        }

        const rows = parseCSV(csvContent);
        if (rows.length === 0) {
            return NextResponse.json({ error: "No data rows found in CSV." }, { status: 400 });
        }

        // Detect column mapping from headers
        const headers = Object.keys(rows[0]);
        const headerMap = mapHeaders(headers);

        if (!headerMap.initial && !headerMap.facultyName) {
            return NextResponse.json({
                error: "CSV must have a 'Faculty Name' or 'Initial' column to match faculty.",
            }, { status: 400 });
        }

        // Each imported review will get its own anonymous user

        // Pre-load all faculty
        const { data: allFaculty } = await supabase
            .from("faculty")
            .select("id, name, initial, department")
            .eq("is_active", true);

        if (!allFaculty || allFaculty.length === 0) {
            return NextResponse.json({ error: "No faculty found in database." }, { status: 400 });
        }

        // Pre-load/create question IDs
        const questionIds: Record<string, string> = {};
        for (const key of ["attendance", "grading", "teaching", "recommend", "comment"]) {
            questionIds[key] = await getOrCreateQuestion(key);
        }


        let imported = 0;
        let skipped = 0;
        const skippedReasons: string[] = [];

        for (const row of rows) {
            // Match faculty
            const initial = headerMap.initial ? row[headerMap.initial]?.trim().toUpperCase() : "";
            const facultyName = headerMap.facultyName ? row[headerMap.facultyName]?.trim() : "";

            if (!initial && !facultyName) {
                skipped++;
                skippedReasons.push("Row with no faculty name or initial");
                continue;
            }

            // Try to match by initial first, then by name
            let matchedFaculty = initial
                ? allFaculty.find((f) => f.initial?.toUpperCase() === initial)
                : null;

            if (!matchedFaculty && facultyName) {
                matchedFaculty = allFaculty.find(
                    (f) => f.name.toLowerCase() === facultyName.toLowerCase()
                );
            }

            if (!matchedFaculty) {
                skipped++;
                skippedReasons.push(`No match: ${initial || facultyName}`);
                continue;
            }

            // Update faculty name if it's missing or just an initial and the CSV has the full name
            if (facultyName && matchedFaculty.name !== facultyName) {
                const { error: updateErr } = await supabase
                    .from("faculty")
                    .update({ name: facultyName })
                    .eq("id", matchedFaculty.id);
                if (!updateErr) {
                    matchedFaculty.name = facultyName;
                }
            }

            // Create a unique anonymous user for this review
            const anonUserId = await createAnonymousUser();

            // Create review
            const { data: review, error: reviewErr } = await supabase
                .from("reviews")
                .insert({
                    user_id: anonUserId,
                    faculty_id: matchedFaculty.id,
                    is_visible: true,
                })
                .select("id")
                .single();

            if (reviewErr) {
                skipped++;
                skippedReasons.push(`DB error for ${initial || facultyName}: ${reviewErr.message}`);
                continue;
            }

            // Create answers
            const answerRows: { review_id: string; question_id: string; answer_value: string }[] = [];

            // MCQ answers
            for (const key of ["attendance", "grading", "teaching", "recommend"] as const) {
                if (headerMap[key]) {
                    let val = row[headerMap[key]]?.trim();
                    if (val) {
                        // Normalize values
                        if (val.toLowerCase() === "yes") val = "Yes";
                        else if (val.toLowerCase() === "no") val = "No";
                        else if (val.toLowerCase() === "drop") val = "Drop";

                        answerRows.push({
                            review_id: review.id,
                            question_id: questionIds[key],
                            answer_value: val,
                        });
                    }
                }
            }

            // Comment
            if (headerMap.comment) {
                const comment = row[headerMap.comment]?.trim();
                if (comment) {
                    answerRows.push({
                        review_id: review.id,
                        question_id: questionIds.comment,
                        answer_value: comment,
                    });
                }
            }

            // Course as a separate answer if present
            if (headerMap.course) {
                const course = row[headerMap.course]?.trim();
                if (course) {
                    // Get or create course question
                    const { data: courseQ } = await supabase
                        .from("review_questions")
                        .select("id")
                        .eq("question_text", "Which course did you take with this faculty?")
                        .single();

                    if (courseQ) {
                        answerRows.push({
                            review_id: review.id,
                            question_id: courseQ.id,
                            answer_value: course,
                        });
                    }
                }
            }

            if (answerRows.length > 0) {
                await supabase.from("review_answers").insert(answerRows);
            }

            imported++;
        }

        return NextResponse.json({
            success: true,
            imported,
            skipped,
            total: rows.length,
            skippedReasons: skippedReasons.slice(0, 20), // Cap at 20 to avoid huge responses
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
