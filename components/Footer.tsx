import Link from "next/link";
import { getContributors, getSiteConfig } from "@/lib/db/contributors";

export default async function Footer() {
  const [contributors, config] = await Promise.all([
    getContributors(),
    getSiteConfig(),
  ]);

  const version = config.version || "1.0";

  // Group by role
  const grouped = contributors.reduce((acc: any, c: any) => {
    if (!acc[c.role]) acc[c.role] = [];
    acc[c.role].push(c);
    return acc;
  }, {});

  return (
    <footer style={{
      borderTop: "1.5px solid #0f0f0f",
      background: "#0f0f0f",
    }}>

      {/* Main footer content */}
      <div style={{
        padding: "64px 32px",
        display: "grid",
        gridTemplateColumns: `repeat(${Object.keys(grouped).length + 1}, 1fr)`,
        gap: "48px",
      }} className="footer-grid">

        {/* Logo + version */}
        <div style={{
          display: "flex", flexDirection: "column",
          justifyContent: "space-between",
        }}>
          <div>
            <div style={{
              fontFamily: "var(--font-mono)", fontSize: "14px",
              fontWeight: 500, letterSpacing: "0.08em",
              textTransform: "uppercase", color: "#f5f2eb",
              marginBottom: "12px",
            }}>
              Know Your{" "}
              <span style={{ color: "#d4401a" }}>Faculty</span>
            </div>
            <div style={{
              fontFamily: "var(--font-mono)", fontSize: "11px",
              color: "#f5f2eb", opacity: 0.35,
              lineHeight: 1.6, maxWidth: "200px",
            }}>
              Real reviews from EWU students. Know your faculty before you enroll.
            </div>
          </div>

          <div style={{ marginTop: "32px" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              fontFamily: "var(--font-mono)", fontSize: "11px",
              letterSpacing: "0.08em", textTransform: "uppercase",
              color: "#f5f2eb", opacity: 0.3,
              border: "1px solid rgba(255,255,255,0.15)",
              padding: "5px 10px",
            }}>
              <span style={{
                width: "6px", height: "6px", borderRadius: "50%",
                background: "#d4401a", display: "inline-block",
              }} />
              Version {version}
            </div>
          </div>
        </div>

        {/* Contributor groups */}
        {Object.entries(grouped).map(([role, people]: [string, any]) => (
          <div key={role}>
            <div style={{
              fontFamily: "var(--font-mono)", fontSize: "10px",
              letterSpacing: "0.14em", textTransform: "uppercase",
              color: "#f5f2eb", opacity: 0.35,
              marginBottom: "20px",
              paddingBottom: "10px",
              borderBottom: "1px solid rgba(255,255,255,0.1)",
            }}>
              {role}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {people.map((person: any) => (
                <div key={person.id}>
                  <div style={{
                    fontFamily: "var(--font-sans)", fontSize: "15px",
                    fontWeight: 700, letterSpacing: "-0.01em",
                    color: "#f5f2eb", marginBottom: "4px",
                  }}>
                    {person.name}
                  </div>

                  {person.student_id && (
                    <div style={{
                      fontFamily: "var(--font-mono)", fontSize: "11px",
                      color: "#f5f2eb", opacity: 0.4,
                      letterSpacing: "0.04em", marginBottom: "4px",
                    }}>
                      ID: {person.student_id}
                    </div>
                  )}

                  <div style={{
                    display: "flex", flexDirection: "column", gap: "3px",
                    marginTop: "6px",
                  }}>
                    {person.email && (
                      <a href={`mailto:${person.email}`} style={{
                        fontFamily: "var(--font-mono)", fontSize: "11px",
                        color: "#d4401a", opacity: 0.8,
                        textDecoration: "none", letterSpacing: "0.02em",
                      }}>
                        {person.email}
                      </a>
                    )}
                    {person.website && (
                      <a
                        href={`https://${person.website.replace(/^https?:\/\//, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontFamily: "var(--font-mono)", fontSize: "11px",
                          color: "#f5f2eb", opacity: 0.4,
                          textDecoration: "none", letterSpacing: "0.02em",
                        }}
                      >
                        {person.website}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div style={{
        padding: "20px 32px",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        display: "flex", justifyContent: "space-between",
        alignItems: "center", flexWrap: "wrap", gap: "12px",
      }}>
        <div style={{
          fontFamily: "var(--font-mono)", fontSize: "11px",
          letterSpacing: "0.06em", color: "#f5f2eb", opacity: 0.25,
        }}>
          © {new Date().getFullYear()} Know Your Faculty · East West University
        </div>
        <div style={{ display: "flex", gap: "24px" }}>
          {[
            ["Schedule", "/schedule"],
            ["Faculty", "/faculty"],
            ["Feed", "/feed"],
          ].map(([label, href]) => (
            <Link key={href} href={href} style={{
              fontFamily: "var(--font-mono)", fontSize: "11px",
              letterSpacing: "0.08em", textTransform: "uppercase",
              color: "#f5f2eb", opacity: 0.25,
              textDecoration: "none",
            }}>
              {label}
            </Link>
          ))}
        </div>
      </div>

      <style>{`
        .footer-grid {
          grid-template-columns: repeat(${Object.keys(grouped).length + 1}, 1fr);
        }
        @media (max-width: 768px) {
          .footer-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </footer>
  );
}
