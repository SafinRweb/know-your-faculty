import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeroSearch from "@/components/HeroSearch";
import { getAllFaculty } from "@/lib/db/faculty";
import { getFacultyReviewCount } from "@/lib/db/faculty";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export default async function HomePage() {
  const [faculty, session, studentCountRes] = await Promise.all([
    getAllFaculty(),
    auth(),
    supabaseAdmin.from("users").select("*", { count: "exact", head: true }).eq("role", "student")
  ]);
  const user = session?.user as any;
  const isLoggedIn = !!session;
  const studentCount = studentCountRes.count || 0;
  const preview = faculty.slice(0, 5);

  return (
    <>
      <Navbar />

      {/* HERO */}
      <section style={{
        minHeight: "100svh", padding: "100px 32px 64px",
        display: "grid", gridTemplateColumns: "1fr 1fr",
        gap: "64px", alignItems: "center",
        borderBottom: "1.5px solid #e8622c",
      }} className="hero-section">
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
              fontWeight: 400, color: "#e8622c",
            }}>Before you enroll.</em>
          </h1>

          <p style={{
            fontFamily: "var(--font-mono)", fontSize: "14px",
            lineHeight: 1.65, opacity: 0.65, maxWidth: "400px", marginBottom: "16px",
          }}>
            Real reviews from EWU students. Strict Attendance policies? Fair grading? Helpful or not?
            teaching quality & more!!!!!
          </p>



          <div style={{
            display: "flex", alignItems: "center",
            gap: "16px", flexWrap: "wrap",
          }}>
            {isLoggedIn ? (
              <>
                <Link href="/faculty" style={{
                  fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 500,
                  letterSpacing: "0.06em", textTransform: "uppercase",
                  color: "#0f0f0f", background: "#e8622c",
                  padding: "14px 28px", border: "1.5px solid #e8622c",
                  textDecoration: "none", display: "inline-flex",
                  alignItems: "center", gap: "10px",
                }}>
                  Browse faculty <span style={{ lineHeight: 1 }}>→</span>
                </Link>
                <Link href="/schedule" style={{
                  fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 500,
                  letterSpacing: "0.06em", textTransform: "uppercase",
                  color: "#f5f2eb", background: "transparent",
                  padding: "14px 28px", border: "1.5px solid #f5f2eb",
                  textDecoration: "none",
                }}>
                  View Courses
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" style={{
                  fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 500,
                  letterSpacing: "0.06em", textTransform: "uppercase",
                  color: "#f5f2eb", background: "#e8622c",
                  padding: "14px 28px", border: "1.5px solid #e8622c",
                  textDecoration: "none", display: "inline-flex",
                  alignItems: "center", gap: "10px",
                }}>
                  Sign in with EWU email <span style={{ lineHeight: 1 }}>→</span>
                </Link>
                <Link href="/faculty" style={{
                  fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 500,
                  letterSpacing: "0.06em", textTransform: "uppercase",
                  color: "#f5f2eb", background: "transparent",
                  padding: "14px 28px", border: "1.5px solid #f5f2eb",
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
          borderLeft: "1.5px solid #2a2725", paddingLeft: "64px",
          display: "flex", flexDirection: "column", gap: "0",
        }} className="hero-right">
          <div style={{
            fontFamily: "var(--font-mono)", fontSize: "11px",
            letterSpacing: "0.1em", textTransform: "uppercase",
            opacity: 0.4, marginBottom: "12px",
          }}>
            Quick search
          </div>
          <HeroSearch />

          {/* Stats — only 2 on desktop, clean */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0" }}>
            {[
              { num: faculty.length + "+", label: "Faculty listed" },
              { num: studentCount + "+", label: "Student helped" },
            ].map((s, i) => (
              <div key={i} style={{
                padding: "28px 24px",
                borderTop: "1.5px solid #f5f2eb",
                borderRight: i % 2 === 0 ? "1.5px solid #f5f2eb" : "none",
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

      </section>

      {/* TICKER */}
      <div style={{
        borderBottom: "1.5px solid #e8622c", overflow: "hidden",
        background: "#e8622c", padding: "13px 0", whiteSpace: "nowrap",
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
                    color: "#f5f2eb", padding: "0 40px", opacity: 0.9,
                  }}>
                    {item}
                  </span>
                  <span style={{
                    fontFamily: "var(--font-mono)", fontSize: "11px",
                    color: "#0f0f0f",
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
      <section style={{ padding: "96px 32px", borderBottom: "1.5px solid #f5f2eb" }}>
        <div style={{
          fontFamily: "var(--font-mono)", fontSize: "16px",
          letterSpacing: "0.14em", textTransform: "uppercase",
          opacity: 0.6, marginBottom: "64px", fontWeight: 500,
        }}>
          What you get
        </div>
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3,1fr)",
          border: "1.5px solid #f5f2eb",
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
            }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", opacity: 0.35, marginBottom: "36px" }}>{f.n}</div>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: "22px", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "16px" }}>{f.title}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "13px", lineHeight: 1.7, opacity: 0.55 }}>{f.text}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FACULTY PREVIEW */}
      <section style={{ padding: "96px 32px", borderBottom: "1.5px solid #f5f2eb" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "48px", flexWrap: "wrap", gap: "24px" }}>
          <h2 style={{ fontFamily: "var(--font-sans)", fontSize: "clamp(28px, 3.5vw, 44px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
            Browse <em style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 400, color: "#e8622c" }}>faculty</em>
          </h2>
          <Link href="/faculty" style={{
            fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 500,
            letterSpacing: "0.06em", textTransform: "uppercase",
            color: "#f5f2eb", border: "1.5px solid #f5f2eb",
            padding: "14px 28px", textDecoration: "none",
          }}>
            View all →
          </Link>
        </div>

        <div>
          {preview.map((f, i) => (
            <Link key={f.id} href={`/faculty/${f.id}`} className="faculty-preview-row" style={{
              display: "grid", gridTemplateColumns: "48px 1fr auto",
              alignItems: "center", gap: "24px", padding: "22px 0",
              borderBottom: i === preview.length - 1 ? "1.5px solid #f5f2eb" : "1px solid #2a2725",
              borderTop: i === 0 ? "1.5px solid #f5f2eb" : undefined,
              textDecoration: "none", color: "#f5f2eb",
            }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", opacity: 0.3 }}>
                {String(i + 1).padStart(2, "0")}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ fontFamily: "var(--font-sans)", fontSize: "17px", fontWeight: 700, letterSpacing: "-0.01em" }}>
                  {f.initial || f.name}
                </div>
                {f.initial && (
                  <div style={{
                    fontFamily: "var(--font-mono)", fontSize: "11px",
                    opacity: 0.8, color: "#e8622c",
                    background: "#2a2725", padding: "2px 7px",
                    alignSelf: "flex-start"
                  }}>
                    {f.name}
                  </div>
                )}
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", letterSpacing: "0.06em", textTransform: "uppercase", opacity: 0.4 }}>
                  {f.department}
                </div>
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "15px", opacity: 0.4 }}>
                →
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
          borderTop: "1.5px solid #e8622c",
        }} className="cta-band">
          <h2 style={{
            fontFamily: "var(--font-sans)", fontSize: "clamp(32px, 5vw, 64px)",
            fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1, color: "#f5f2eb",
          }}>
            Your next semester<br />
            starts with the{" "}
            <em style={{
              fontFamily: "var(--font-serif)", fontStyle: "italic",
              fontWeight: 400, color: "#e8622c",
            }}>right</em> info.
          </h2>
          <Link href="/login" style={{
            fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 500,
            letterSpacing: "0.06em", textTransform: "uppercase",
            color: "#0f0f0f", background: "#e8622c",
            padding: "14px 28px", border: "1.5px solid #e8622c",
            textDecoration: "none", whiteSpace: "nowrap",
          }}>
            Sign in with EWU email →
          </Link>
        </section>
      )}

      {/* FOOTER */}
      <Footer />

      <style>{`
        @keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .feature-card { border-right: 1.5px solid #f5f2eb; border-bottom: 1.5px solid #f5f2eb; }
        .feature-card:nth-child(3n) { border-right: none; }
        .feature-card:nth-last-child(-n+3) { border-bottom: none; }

        @media (max-width: 900px) {
          .hero-section { grid-template-columns: 1fr !important; gap: 24px !important; padding-top: 100px !important; }
          .hero-right { border-left: none !important; padding-left: 0 !important; }
          .hero-bottom { grid-template-columns: 1fr !important; }
          .stats-grid { grid-template-columns: repeat(2,1fr) !important; }
          .features-grid { grid-template-columns: 1fr !important; }
          .feature-card { border-right: none !important; border-bottom: 1.5px solid #f5f2eb !important; }
          .feature-card:last-child { border-bottom: none !important; }
          .cta-band { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 768px) {
          .faculty-preview-row { grid-template-columns: 32px 1fr auto !important; gap: 16px !important; }
        }
      `}</style>
    </>
  );
}