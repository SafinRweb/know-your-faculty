import Link from "next/link";
import { getAllSemesters } from "@/lib/db/semesters";
import { supabaseAdmin as supabase } from "@/lib/supabase";

const PAGE_SIZE = 100;

async function getSections(
  semesterId: string | undefined,
  query: string,
  page: number
) {
  // Get active semester if none selected
  let activeSemId = semesterId;
  if (!activeSemId) {
    const { data: activeSem } = await supabase
      .from("semesters")
      .select("id")
      .eq("is_active", true)
      .single();
    if (activeSem) activeSemId = activeSem.id;
  }

  let q = supabase
    .from("sections")
    .select(`
      id, section_no, day_pattern, time_slot, room,
      course:courses(code, title),
      faculty:faculty(id, name, department, initial),
      semester:semesters(id, label, is_active)
    `, { count: "exact" });

  if (activeSemId) q = q.eq("semester_id", activeSemId);

  if (query) {
    // Search by course code or faculty initial via separate queries
    const { data: matchingCourses } = await supabase
      .from("courses")
      .select("id")
      .ilike("code", `%${query}%`);

    const { data: matchingFaculty } = await supabase
      .from("faculty")
      .select("id")
      .or(`initial.ilike.%${query}%,name.ilike.%${query}%`);

    const courseIds = matchingCourses?.map((c) => c.id) || [];
    const facultyIds = matchingFaculty?.map((f) => f.id) || [];

    if (courseIds.length > 0 && facultyIds.length > 0) {
      q = q.or(
        `course_id.in.(${courseIds.join(",")}),faculty_id.in.(${facultyIds.join(",")})`
      );
    } else if (courseIds.length > 0) {
      q = q.in("course_id", courseIds);
    } else if (facultyIds.length > 0) {
      q = q.in("faculty_id", facultyIds);
    } else {
      return { sections: [], total: 0, semId: activeSemId };
    }
  }

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data, count, error } = await q
    .order("course_id")
    .range(from, to);

  if (error) return { sections: [], total: 0, semId: activeSemId };

  const sorted = (data || []).sort((a: any, b: any) => {
    if (a.course_id !== b.course_id) return 0;
    return parseInt(a.section_no) - parseInt(b.section_no);
  });

  return { sections: sorted, total: count || 0, semId: activeSemId };
}

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; semester?: string; page?: string }>;
}) {
  const params = await searchParams;
  const query = params.q?.toLowerCase().trim() || "";
  const semesterId = params.semester || "";
  const page = Math.max(1, parseInt(params.page || "1"));

  const [semesters, { sections, total, semId }] = await Promise.all([
    getAllSemesters(),
    getSections(semesterId || undefined, query, page),
  ]);

  const selectedSemester = semesters.find(
    (s) => s.id === (semesterId || semId)
  );
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div style={{ paddingTop: "57px" }}>

      {/* HEADER */}
      <div style={{
        padding: "56px 32px 0",
        borderBottom: "1.5px solid #0f0f0f",
      }}>
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr",
          gap: "48px", alignItems: "end", paddingBottom: "40px",
        }} className="schedule-header">
          <div>
            <div style={{
              fontFamily: "var(--font-mono)", fontSize: "11px",
              letterSpacing: "0.14em", textTransform: "uppercase",
              opacity: 0.4, marginBottom: "16px",
            }}>
              {total} row{total !== 1 ? "s" : ""}
              {selectedSemester && ` · ${selectedSemester.label}`}
              {totalPages > 1 && ` · Page ${page} of ${totalPages}`}
            </div>
            <h1 style={{
              fontFamily: "var(--font-sans)",
              fontSize: "clamp(36px, 5vw, 64px)",
              fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 0.95,
            }}>
              Master<br />
              <em style={{
                fontFamily: "var(--font-serif)", fontStyle: "italic",
                fontWeight: 400, color: "#d4401a",
              }}>Schedule</em>
            </h1>
          </div>

          <form method="GET" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {semesterId && <input type="hidden" name="semester" value={semesterId} />}
            <div style={{ display: "flex", border: "1.5px solid #0f0f0f" }}>
              <input
                name="q"
                defaultValue={params.q || ""}
                placeholder="Search course code, faculty initial…"
                style={{
                  flex: 1, fontFamily: "var(--font-mono)", fontSize: "13px",
                  padding: "13px 16px", border: "none",
                  background: "transparent", color: "#0f0f0f", outline: "none",
                }}
              />
              <button type="submit" style={{
                fontFamily: "var(--font-mono)", fontSize: "11px",
                letterSpacing: "0.1em", textTransform: "uppercase",
                padding: "13px 18px", background: "#0f0f0f",
                color: "#f5f2eb", border: "none", cursor: "pointer",
              }}>
                Search
              </button>
            </div>
          </form>
        </div>

        {/* Semester tabs */}
        <div style={{ display: "flex", overflowX: "auto" }}>
          <Link href={`/schedule${query ? `?q=${query}` : ""}`} style={{
            ...tabStyle,
            background: !semesterId ? "#0f0f0f" : "transparent",
            color: !semesterId ? "#f5f2eb" : "#0f0f0f",
          }}>
            All semesters
          </Link>
          {semesters.map((s) => (
            <Link key={s.id}
              href={`/schedule?semester=${s.id}${query ? `&q=${query}` : ""}`}
              style={{
                ...tabStyle,
                background: semesterId === s.id ? "#0f0f0f" : "transparent",
                color: semesterId === s.id ? "#f5f2eb" : "#0f0f0f",
              }}>
              {s.label}
              {s.is_active && (
                <span style={{
                  width: "5px", height: "5px", borderRadius: "50%",
                  background: semesterId === s.id ? "#f5f2eb" : "#1a4fd4",
                  display: "inline-block", marginLeft: "6px",
                }} />
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* TABLE HEADER */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "90px 50px 1fr 170px 130px 70px",
        gap: "16px", padding: "12px 32px",
        borderBottom: "1.5px solid #0f0f0f",
        background: "#f5f2eb",
        position: "sticky", top: "57px", zIndex: 10,
      }} className="table-header">
        {["Course", "Sec", "Faculty", "Time", "Room", ""].map((h) => (
          <div key={h} style={{
            fontFamily: "var(--font-mono)", fontSize: "10px",
            letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.4,
          }}>
            {h}
          </div>
        ))}
      </div>

      {/* ROWS */}
      <div style={{ paddingBottom: "64px" }}>
        {sections.length === 0 ? (
          <div style={{
            padding: "96px 32px", textAlign: "center",
            fontFamily: "var(--font-mono)", fontSize: "13px", opacity: 0.4,
          }}>
            {query ? `No results for "${query}"` : "No sections found."}
          </div>
        ) : (
          sections.map((s: any, i: number) => (
            <div key={s.id} style={{
              display: "grid",
              gridTemplateColumns: "90px 50px 1fr 170px 130px 70px",
              gap: "16px", padding: "14px 32px",
              borderBottom: "1px solid #e8e3d9",
              background: i % 2 === 0 ? "transparent" : "#faf8f4",
              alignItems: "center",
            }} className="section-row">

              {/* Course */}
              <div style={{
                fontFamily: "var(--font-mono)", fontSize: "12px",
                fontWeight: 500, letterSpacing: "0.04em",
              }}>
                {s.course?.code}
              </div>

              {/* Section */}
              <div style={{
                fontFamily: "var(--font-mono)", fontSize: "12px",
                opacity: 0.5,
              }}>
                {s.section_no}
              </div>

              {/* Faculty */}
              {s.faculty?.initial === "TBA" ? (
                <div style={{
                  fontFamily: "var(--font-mono)", fontSize: "12px",
                  opacity: 0.35, fontStyle: "italic",
                }}>
                  Faculty TBA
                </div>
              ) : (
                <Link href={`/faculty/${s.faculty?.id}`} style={{
                  fontFamily: "var(--font-sans)", fontSize: "14px",
                  fontWeight: 600, letterSpacing: "-0.01em",
                  color: "#0f0f0f", textDecoration: "none",
                  display: "flex", alignItems: "center", gap: "8px",
                }}>
                  {s.faculty?.name === s.faculty?.initial
                    ? s.faculty?.initial
                    : s.faculty?.name}
                  <span style={{
                    fontFamily: "var(--font-mono)", fontSize: "10px",
                    opacity: 0.4, fontWeight: 400,
                    background: "#e8e3d9", padding: "2px 6px",
                  }}>
                    {s.faculty?.initial}
                  </span>
                </Link>
              )}

              {/* Time */}
              <div style={{
                fontFamily: "var(--font-mono)", fontSize: "11px", opacity: 0.6,
              }}>
                {s.day_pattern && `${s.day_pattern} · `}{s.time_slot || "—"}
              </div>

              {/* Room */}
              <div style={{
                fontFamily: "var(--font-mono)", fontSize: "11px", opacity: 0.5,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {s.room || "—"}
              </div>

              {/* Profile link */}
              {s.faculty?.initial !== "TBA" ? (
                <Link href={`/faculty/${s.faculty?.id}`} style={{
                  fontFamily: "var(--font-mono)", fontSize: "11px",
                  letterSpacing: "0.06em", textTransform: "uppercase",
                  color: "#0f0f0f", opacity: 0.3,
                  textDecoration: "none", whiteSpace: "nowrap",
                }}>
                  Profile →
                </Link>
              ) : <div />}
            </div>
          ))
        )}
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div style={{
          display: "flex", justifyContent: "center",
          alignItems: "center", gap: "8px",
          padding: "32px", borderTop: "1.5px solid #0f0f0f",
        }}>
          {page > 1 && (
            <Link
              href={`/schedule?${new URLSearchParams({
                ...(query && { q: query }),
                ...(semesterId && { semester: semesterId }),
                page: String(page - 1),
              })}`}
              style={pageBtn(false)}>
              ← Prev
            </Link>
          )}

          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            const p = totalPages <= 7
              ? i + 1
              : page <= 4
              ? i + 1
              : page >= totalPages - 3
              ? totalPages - 6 + i
              : page - 3 + i;
            return (
              <Link
                key={p}
                href={`/schedule?${new URLSearchParams({
                  ...(query && { q: query }),
                  ...(semesterId && { semester: semesterId }),
                  page: String(p),
                })}`}
                style={pageBtn(p === page)}>
                {p}
              </Link>
            );
          })}

          {page < totalPages && (
            <Link
              href={`/schedule?${new URLSearchParams({
                ...(query && { q: query }),
                ...(semesterId && { semester: semesterId }),
                page: String(page + 1),
              })}`}
              style={pageBtn(false)}>
              Next →
            </Link>
          )}
        </div>
      )}

      <style>{`
        .schedule-header { grid-template-columns: 1fr 1fr; }

        /* Desktop table */
        .table-header { 
          grid-template-columns: 90px 50px 1fr 170px 130px 70px; 
          position: sticky; top: 57px; z-index: 10;
        }
        .section-row { 
          grid-template-columns: 90px 50px 1fr 170px 130px 70px; 
        }

        /* Mobile — card style instead of table */
        @media (max-width: 768px) {
          .schedule-header { grid-template-columns: 1fr !important; }
          .table-header { display: none !important; }
          .section-row {
            grid-template-columns: 1fr 1fr !important;
            grid-template-rows: auto auto auto !important;
            padding: 16px 20px !important;
            gap: 6px !important;
            border-bottom: 1.5px solid #e8e3d9 !important;
            position: relative;
          }
          /* Course + Section on first row */
          .section-row > div:nth-child(1) { 
            font-size: 13px !important; 
            font-weight: 700 !important;
            grid-column: 1;
          }
          .section-row > div:nth-child(2) { 
            text-align: right;
            grid-column: 2;
            opacity: 0.5 !important;
          }
          /* Faculty full row */
          .section-row > div:nth-child(3),
          .section-row > a:nth-child(3) { 
            grid-column: 1 / -1;
            font-size: 15px !important;
          }
          /* Time full row */
          .section-row > div:nth-child(4) { 
            grid-column: 1 / -1;
            font-size: 12px !important;
            opacity: 0.6 !important;
          }
          /* Room */
          .section-row > div:nth-child(5) { 
            grid-column: 1;
            font-size: 11px !important;
          }
          /* Profile link */
          .section-row > a:last-child { 
            grid-column: 2;
            text-align: right;
          }
        }
      `}</style>
    </div>
  );
}

const tabStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono)", fontSize: "11px",
  letterSpacing: "0.08em", textTransform: "uppercase",
  padding: "14px 20px", textDecoration: "none",
  borderRight: "1px solid #e8e3d9", whiteSpace: "nowrap",
  display: "inline-flex", alignItems: "center",
  transition: "background 0.12s",
};

function pageBtn(active: boolean): React.CSSProperties {
  return {
    fontFamily: "var(--font-mono)", fontSize: "12px",
    letterSpacing: "0.06em", padding: "8px 14px",
    border: "1.5px solid #0f0f0f",
    background: active ? "#0f0f0f" : "transparent",
    color: active ? "#f5f2eb" : "#0f0f0f",
    textDecoration: "none",
  };
}