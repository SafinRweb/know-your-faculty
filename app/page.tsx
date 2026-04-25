import Link from "next/link";
import Navbar from "@/components/Navbar";
import { getAllFaculty } from "@/lib/db/faculty";
import { getFacultyReviewCount } from "@/lib/db/faculty";
import { auth } from "@/lib/auth";

export default async function HomePage() {
  const [faculty, session] = await Promise.all([
    getAllFaculty(),
    auth(),
  ]);
  const user = session?.user as any;
  const isLoggedIn = !!session;
  const preview = faculty.slice(0, 5);

  return (
    <>
      <Navbar />

      {/* HERO */}
      {/* HERO */}
      <section style={{
        minHeight: "100svh", padding: "100px 32px 64px",
        display: "grid", gridTemplateColumns: "1fr 1fr",
        gap: "64px", alignItems: "center",
        borderBottom: "1.5px solid #0f0f0f",
      }}>
        {/* LEFT */}
        <div>
          <h1 style={{
            fontFamily: "var(--font-sans)",
            fontSize: "clamp(48px, 6.5vw, 96px)",
            fontWeight: 800, lineHeight: 0.92,
            letterSpacing: "-0.03em", marginBottom: "40px",
          }}>
            Know your<br />
            faculty.<br />
            <em style={{
              fontFamily: "var(--font-serif)", fontStyle: "italic",
              fontWeight: 400, color: "#d4401a",
            }}>Before you enroll.</em>
          </h1>

          <p style={{
            fontFamily: "var(--font-mono)", fontSize: "14px",
            lineHeight: 1.65, opacity: 0.65, maxWidth: "400px", marginBottom: "16px",
          }}>
            Real reviews from EWU students. Attendance patterns, grading clarity,
            teaching quality — filtered by semester, backed by data. No fluff.
          </p>

          <div style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            fontFamily: "var(--font-mono)", fontSize: "11px",
            letterSpacing: "0.06em", textTransform: "uppercase",
            background: "#e8e3d9", border: "1px solid #c8c2b4",
            padding: "5px 10px", marginBottom: "32px",
          }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#1a4fd4", display: "inline-block" }} />
            1 review per faculty · EWU email required
          </div>

          <div style={{
            display: "flex", alignItems: "center",
            gap: "16px", flexWrap: "wrap",
          }}>
            {isLoggedIn ? (
              <>
                <Link href="/faculty" style={{
                  fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 500,
                  letterSpacing: "0.06em", textTransform: "uppercase",
                  color: "#f5f2eb", background: "#0f0f0f",
                  padding: "14px 28px", border: "1.5px solid #0f0f0f",
                  textDecoration: "none", display: "inline-flex",
                  alignItems: "center", gap: "10px",
                }}>
                  Browse faculty <span>→</span>
                </Link>
                <Link href="/schedule" style={{
                  fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 500,
                  letterSpacing: "0.06em", textTransform: "uppercase",
                  color: "#0f0f0f", background: "transparent",
                  padding: "14px 28px", border: "1.5px solid #0f0f0f",
                  textDecoration: "none",
                }}>
                  View schedule
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" style={{
                  fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 500,
                  letterSpacing: "0.06em", textTransform: "uppercase",
                  color: "#f5f2eb", background: "#0f0f0f",
                  padding: "14px 28px", border: "1.5px solid #0f0f0f",
                  textDecoration: "none", display: "inline-flex",
                  alignItems: "center", gap: "10px",
                }}>
                  Sign in with EWU email <span>→</span>
                </Link>
                <Link href="/faculty" style={{
                  fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 500,
                  letterSpacing: "0.06em", textTransform: "uppercase",
                  color: "#0f0f0f", background: "transparent",
                  padding: "14px 28px", border: "1.5px solid #0f0f0f",
                  textDecoration: "none",
                }}>
                  Browse faculty
                </Link>
              </>
            )}
          </div>
        </div>

        {/* RIGHT — search + quick stats */}
        <div style={{
          borderLeft: "1.5px solid #0f0f0f", paddingLeft: "64px",
          display: "flex", flexDirection: "column", gap: "0",
        }} className="hero-right">
          <div style={{
            fontFamily: "var(--font-mono)", fontSize: "11px",
            letterSpacing: "0.1em", textTransform: "uppercase",
            opacity: 0.4, marginBottom: "12px",
          }}>
            Quick search
          </div>
          <div style={{
            display: "flex", alignItems: "stretch",
            border: "1.5px solid #0f0f0f", marginBottom: "48px",
          }}>
            <input
              type="text"
              placeholder="Faculty name, initial or course…"
              style={{
                flex: 1, fontFamily: "var(--font-mono)", fontSize: "13px",
                padding: "13px 16px", border: "none", background: "transparent",
                color: "#0f0f0f", outline: "none",
              }}
            />
            <Link href="/schedule" style={{
              fontFamily: "var(--font-mono)", fontSize: "11px",
              letterSpacing: "0.1em", textTransform: "uppercase",
              padding: "13px 18px", background: "#0f0f0f",
              color: "#f5f2eb", textDecoration: "none",
              display: "flex", alignItems: "center",
            }}>
              Search
            </Link>
          </div>

          {/* Stats — only 2 on desktop, clean */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0" }}>
            {[
              { num: faculty.length + "+", label: "Faculty listed" },
              { num: "—", label: "Students enrolled" },
            ].map((s, i) => (
              <div key={i} style={{
                padding: "28px 24px",
                borderTop: "1.5px solid #0f0f0f",
                borderRight: i % 2 === 0 ? "1.5px solid #0f0f0f" : "none",
              }}>
                <div style={{
                  fontFamily: "var(--font-sans)", fontSize: "36px",
                  fontWeight: 800, letterSpacing: "-0.04em",
                  lineHeight: 1, marginBottom: "6px",
                }}>
                  {s.num}
                </div>
                <div style={{
                  fontFamily: "var(--font-mono)", fontSize: "11px",
                  letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.4,
                }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <style>{`
    @media (max-width: 900px) {
      section:first-of-type { grid-template-columns: 1fr !important; }
      section:first-of-type > div:last-of-type { border-left: none !important; padding-left: 0 !important; padding-top: 40px; }
      .hero-right { display: none !important; }
    }
  `}</style>
      </section>

      {/* TICKER */}
      <div style={{
        borderBottom: "1.5px solid #0f0f0f", overflow: "hidden",
        background: "#0f0f0f", padding: "13px 0", whiteSpace: "nowrap",
      }}>
        <div style={{ display: "inline-flex", width: "max-content", animation: "ticker 22s linear infinite" }}>
          {[0, 1].map((groupIndex) => (
            <div key={groupIndex} style={{ display: "inline-flex", alignItems: "center" }}>
              {["Faculty Reviews", "Semester Breakdown", "EWU Master Schedule",
                "Verified Students Only", "Grading Patterns", "Attendance Policy",
                "Teaching Clarity", "Community Feed",
              ].map((item, i) => (
                <div key={i} style={{ display: "inline-flex", alignItems: "center" }}>
                  <span style={{
                    fontFamily: "var(--font-mono)", fontSize: "11px",
                    letterSpacing: "0.14em", textTransform: "uppercase",
                    color: "#f5f2eb", padding: "0 40px", opacity: 0.7,
                  }}>
                    {item}
                  </span>
                  <span style={{
                    fontFamily: "var(--font-mono)", fontSize: "11px",
                    color: "#d4401a",
                  }}>
                    ★
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>



      {/* FEATURES */}
      <section style={{ padding: "96px 32px", borderBottom: "1.5px solid #0f0f0f" }}>
        <div style={{
          fontFamily: "var(--font-mono)", fontSize: "11px",
          letterSpacing: "0.14em", textTransform: "uppercase",
          opacity: 0.45, marginBottom: "64px",
        }}>
          What you get
        </div>
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3,1fr)",
          border: "1.5px solid #0f0f0f",
        }} className="features-grid">
          {[
            { n: "01", title: "Faculty Analytics", text: "Per-semester breakdown of attendance strictness, grading patterns, and teaching clarity. Data — not star ratings." },
            { n: "02", title: "Verified Reviews", text: "Every review is tied to one EWU student email. No spam. One account, one review per faculty." },
            { n: "03", title: "Master Schedule", text: "Search any course or faculty and instantly see all sections for the current semester." },
            { n: "04", title: "Semester Filter", text: "Filter analytics by semester to see if teaching quality improved or declined over time." },
            { n: "05", title: "Edit Anytime", text: "Already left a review? Update it after finals. One review, always yours to revise." },
            { n: "06", title: "Community Feed", text: "A live board for announcements, missing sections, and advising questions — moderated by admins." },
          ].map((f, i) => (
            <div key={i} className="feature-card" style={{
              padding: "48px 36px",
              borderRight: (i + 1) % 3 !== 0 ? "1.5px solid #0f0f0f" : "none",
              borderBottom: i < 3 ? "1.5px solid #0f0f0f" : "none",
            }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", opacity: 0.35, marginBottom: "36px" }}>{f.n}</div>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: "22px", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "16px" }}>{f.title}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "13px", lineHeight: 1.7, opacity: 0.55 }}>{f.text}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FACULTY PREVIEW */}
      <section style={{ padding: "96px 32px", borderBottom: "1.5px solid #0f0f0f" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "48px", flexWrap: "wrap", gap: "24px" }}>
          <h2 style={{ fontFamily: "var(--font-sans)", fontSize: "clamp(28px, 3.5vw, 44px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
            Browse <em style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 400 }}>faculty</em>
          </h2>
          <Link href="/faculty" style={{
            fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 500,
            letterSpacing: "0.06em", textTransform: "uppercase",
            color: "#0f0f0f", border: "1.5px solid #0f0f0f",
            padding: "14px 28px", textDecoration: "none",
          }}>
            View all →
          </Link>
        </div>

        <div>
          {preview.map((f, i) => (
            <Link key={f.id} href={`/faculty/${f.id}`} style={{
              display: "grid", gridTemplateColumns: "48px 1fr auto",
              alignItems: "center", gap: "24px", padding: "22px 0",
              borderBottom: i === preview.length - 1 ? "1.5px solid #0f0f0f" : "1px solid #e8e3d9",
              borderTop: i === 0 ? "1.5px solid #0f0f0f" : undefined,
              textDecoration: "none", color: "#0f0f0f",
            }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", opacity: 0.3 }}>
                {String(i + 1).padStart(2, "0")}
              </div>
              <div>
                <div style={{ fontFamily: "var(--font-sans)", fontSize: "17px", fontWeight: 700, letterSpacing: "-0.01em" }}>{f.name}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", letterSpacing: "0.06em", textTransform: "uppercase", opacity: 0.4, marginTop: "4px" }}>{f.department}</div>
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", opacity: 0.4, letterSpacing: "0.04em" }}>
                View profile →
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      {!isLoggedIn && (
        <section style={{
          padding: "96px 32px", background: "#0f0f0f",
          display: "grid", gridTemplateColumns: "1fr auto",
          alignItems: "center", gap: "48px",
        }} className="cta-band">
          <h2 style={{
            fontFamily: "var(--font-sans)", fontSize: "clamp(32px, 5vw, 64px)",
            fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1, color: "#f5f2eb",
          }}>
            Your next semester<br />
            starts with the{" "}
            <em style={{
              fontFamily: "var(--font-serif)", fontStyle: "italic",
              fontWeight: 400, color: "#d4401a",
            }}>right</em> info.
          </h2>
          <Link href="/login" style={{
            fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 500,
            letterSpacing: "0.06em", textTransform: "uppercase",
            color: "#0f0f0f", background: "#f5f2eb",
            padding: "14px 28px", border: "1.5px solid #f5f2eb",
            textDecoration: "none", whiteSpace: "nowrap",
          }}>
            Sign in with EWU email →
          </Link>
        </section>
      )}

      {/* FOOTER */}
      <footer style={{
        padding: "40px 32px", display: "flex",
        alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: "24px",
      }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.4 }}>
          © 2025 Know Your Faculty · EWU Students
        </div>
        <div style={{ display: "flex", gap: "32px" }}>
          {[["Schedule", "/schedule"], ["Faculty", "/faculty"], ["Feed", "/feed"]].map(([label, href]) => (
            <Link key={href} href={href} style={{
              fontFamily: "var(--font-mono)", fontSize: "11px",
              letterSpacing: "0.08em", textTransform: "uppercase",
              color: "#0f0f0f", textDecoration: "none", opacity: 0.4,
            }}>
              {label}
            </Link>
          ))}
        </div>
      </footer>

      <style>{`
        @keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @media (max-width: 900px) {
          .hero-bottom { grid-template-columns: 1fr !important; }
          .stats-grid { grid-template-columns: repeat(2,1fr) !important; }
          .features-grid { grid-template-columns: 1fr !important; }
          .cta-band { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
}