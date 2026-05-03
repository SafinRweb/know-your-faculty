import Link from "next/link";
import { getAllFaculty } from "@/lib/db/faculty";

export default async function FacultyDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ dept?: string; q?: string }>;
}) {
  const [allFaculty, params] = await Promise.all([
    getAllFaculty(),
    searchParams,
  ]);

  const dept = params.dept || "All";
  const q = params.q?.toLowerCase() || "";

  const departments = [
    "All",
    ...Array.from(new Set(allFaculty.map((f) => f.department))).sort(),
  ];

  const filtered = allFaculty.filter((f) => {
    const matchDept = dept === "All" || f.department === dept;
    const matchQuery =
      !q ||
      f.name.toLowerCase().includes(q) ||
      f.department.toLowerCase().includes(q) ||
      (f.initial?.toLowerCase() || "").includes(q);
    return matchDept && matchQuery;
  });

  const isFiltered = !!q || dept !== "All";

  return (
    <div style={{ paddingTop: "57px" }}>

      {/* PAGE HEADER */}
      <div style={{
        padding: "64px 32px 48px",
        borderBottom: "1.5px solid #f5f2eb",
        display: "grid", gridTemplateColumns: "1fr 1fr",
        gap: "48px", alignItems: "end",
      }} className="faculty-header">
        <div>
          <div style={{
            fontFamily: "var(--font-mono)", fontSize: "11px",
            letterSpacing: "0.14em", textTransform: "uppercase",
            opacity: 0.4, marginBottom: "16px",
          }}>
            {isFiltered
              ? `${filtered.length} results${q ? ` for "${params.q}"` : ""}${dept !== "All" ? ` in ${dept}` : ""}`
              : `${allFaculty.length} faculty listed`}
          </div>
          <h1 style={{
            fontFamily: "var(--font-sans)",
            fontSize: "clamp(36px, 5vw, 64px)",
            fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 0.95,
          }}>
            Faculty<br />
            <em style={{
              fontFamily: "var(--font-serif)", fontStyle: "italic",
              fontWeight: 400, color: "#d4401a",
            }}>Directory</em>
          </h1>

          {/* Active filter pill */}
          {isFiltered && (
            <div style={{
              display: "flex", alignItems: "center",
              gap: "10px", marginTop: "16px", flexWrap: "wrap",
            }}>
              <span style={{
                fontFamily: "var(--font-mono)", fontSize: "11px",
                opacity: 0.5, letterSpacing: "0.06em",
              }}>
                Showing results for:
              </span>
              {q && (
                <span style={{
                  fontFamily: "var(--font-mono)", fontSize: "11px",
                  letterSpacing: "0.06em", background: "#f5f2eb",
                  color: "#0f0f0f", padding: "4px 10px",
                  display: "flex", alignItems: "center", gap: "8px",
                }}>
                  "{params.q}"
                  <Link href={`/faculty?dept=${dept}`} style={{
                    color: "#0f0f0f", opacity: 0.6, textDecoration: "none",
                    fontSize: "13px",
                  }}>×</Link>
                </span>
              )}
              {dept !== "All" && (
                <span style={{
                  fontFamily: "var(--font-mono)", fontSize: "11px",
                  letterSpacing: "0.06em", background: "#f5f2eb",
                  color: "#0f0f0f", padding: "4px 10px",
                  display: "flex", alignItems: "center", gap: "8px",
                }}>
                  {dept}
                  <Link href={`/faculty${q ? `?q=${params.q}` : ""}`} style={{
                    color: "#0f0f0f", opacity: 0.6, textDecoration: "none",
                    fontSize: "13px",
                  }}>×</Link>
                </span>
              )}
              <Link href="/faculty" style={{
                fontFamily: "var(--font-mono)", fontSize: "11px",
                letterSpacing: "0.06em", textTransform: "uppercase",
                color: "#d4401a", textDecoration: "none", opacity: 0.8,
              }}>
                Clear all
              </Link>
            </div>
          )}
        </div>

        <form method="GET" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {dept !== "All" && <input type="hidden" name="dept" value={dept} />}
          <div style={{ display: "flex", border: "1.5px solid #f5f2eb" }}>
            <input
              name="q"
              defaultValue={params.q || ""}
              placeholder="Search by name, initial or department…"
              style={{
                flex: 1, fontFamily: "var(--font-mono)", fontSize: "13px",
                padding: "13px 16px", border: "none",
                background: "transparent", color: "#f5f2eb", outline: "none",
              }}
            />
            <button type="submit" style={{
              fontFamily: "var(--font-mono)", fontSize: "11px",
              letterSpacing: "0.1em", textTransform: "uppercase",
              padding: "13px 18px", background: "#f5f2eb",
              color: "#0f0f0f", border: "none", cursor: "pointer",
            }}>
              Search
            </button>
          </div>

          {/* Dept filter */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {departments.map((d) => (
              <Link
                key={d}
                href={`/faculty?dept=${d}${q ? `&q=${params.q}` : ""}`}
                style={{
                  fontFamily: "var(--font-mono)", fontSize: "11px",
                  letterSpacing: "0.08em", textTransform: "uppercase",
                  padding: "6px 12px", textDecoration: "none",
                  border: "1.5px solid #f5f2eb",
                  background: dept === d ? "#f5f2eb" : "transparent",
                  color: dept === d ? "#0f0f0f" : "#f5f2eb",
                }}>
                {d}
              </Link>
            ))}
          </div>
        </form>
      </div>

      {/* FACULTY LIST */}
      <div style={{ padding: "0 32px 96px" }}>
        {filtered.length === 0 ? (
          <div style={{
            padding: "64px 0", textAlign: "center",
          }}>
            <div style={{
              fontFamily: "var(--font-mono)", fontSize: "13px",
              opacity: 0.4, marginBottom: "16px",
            }}>
              No faculty found matching your search.
            </div>
            <Link href="/faculty" style={{
              fontFamily: "var(--font-mono)", fontSize: "12px",
              letterSpacing: "0.06em", textTransform: "uppercase",
              color: "#f5f2eb", border: "1.5px solid #f5f2eb",
              padding: "10px 20px", textDecoration: "none",
            }}>
              Clear search
            </Link>
          </div>
        ) : (
          <div>
            {filtered.map((f, i) => (
              <Link
                key={f.id}
                href={`/faculty/${f.id}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "56px 1fr auto auto",
                  alignItems: "center", gap: "24px",
                  padding: "24px 0",
                  borderBottom: "1px solid #2a2725",
                  textDecoration: "none", color: "#f5f2eb",
                }}
                className="faculty-row"
              >
                <div style={{
                  fontFamily: "var(--font-mono)", fontSize: "11px",
                  opacity: 0.25, letterSpacing: "0.06em",
                }}>
                  {String(i + 1).padStart(2, "0")}
                </div>

                <div>
                  <div style={{
                    fontFamily: "var(--font-sans)", fontSize: "18px",
                    fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "4px",
                  }}>
                    {f.name}
                  </div>
                  <div style={{
                    fontFamily: "var(--font-mono)", fontSize: "11px",
                    letterSpacing: "0.08em", textTransform: "uppercase",
                    opacity: 0.4, display: "flex", alignItems: "center", gap: "8px",
                  }}>
                    {f.department}
                    {f.initial && (
                      <span style={{
                        background: "#f5f2eb", color: "#0f0f0f",
                        padding: "2px 7px", fontSize: "10px",
                      }}>
                        {f.initial}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{
                  fontFamily: "var(--font-mono)", fontSize: "11px",
                  letterSpacing: "0.06em", textTransform: "uppercase",
                  opacity: 0.3, textAlign: "right",
                }}>
                  {f.department}
                </div>

                <div style={{
                  fontFamily: "var(--font-mono)", fontSize: "12px",
                  letterSpacing: "0.06em", textTransform: "uppercase",
                  opacity: 0.4, whiteSpace: "nowrap",
                }}>
                  View →
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .faculty-header { grid-template-columns: 1fr 1fr; }
        .faculty-row:hover { background: #f0ece3; padding-left: 8px !important; }
        @media (max-width: 768px) {
          .faculty-header { grid-template-columns: 1fr !important; }
          .faculty-row { grid-template-columns: 40px 1fr auto !important; }
          .faculty-row > div:nth-child(3) { display: none; }
        }
      `}</style>
    </div>
  );
}