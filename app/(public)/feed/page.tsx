import { auth } from "@/lib/auth";
import { getFeedPosts } from "@/lib/db/feed";
import FeedClient from "@/components/FeedClient";

export default async function FeedPage() {
    const [posts, session] = await Promise.all([
        getFeedPosts(),
        auth(),
    ]);

    const user = session?.user as any;

    return (
        <div style={{ paddingTop: "57px" }}>
            <div style={{
                display: "grid", gridTemplateColumns: "1fr 340px",
                alignItems: "start", minHeight: "calc(100svh - 57px)",
            }} className="feed-layout">

                {/* MAIN */}
                <div style={{ borderRight: "1.5px solid #1e1c1a" }}>

                    {/* Header */}
                    <div style={{
                        padding: "56px 32px 40px",
                        borderBottom: "1.5px solid #e8622c",
                        background: "linear-gradient(180deg, rgba(232,98,44,0.06) 0%, transparent 100%)",
                    }}>
                        <div style={{
                            fontFamily: "var(--font-mono)", fontSize: "11px",
                            letterSpacing: "0.14em", textTransform: "uppercase",
                            opacity: 0.4, marginBottom: "16px",
                            display: "flex", alignItems: "center", gap: "8px",
                        }}>
                            <span style={{
                                width: "6px", height: "6px", borderRadius: "50%",
                                background: "#e8622c", display: "inline-block",
                            }} />
                            {posts.length} post{posts.length !== 1 ? "s" : ""} · Live
                        </div>
                        <h1 style={{
                            fontFamily: "var(--font-sans)",
                            fontSize: "clamp(36px, 5vw, 64px)",
                            fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 0.95,
                        }}>
                            Community<br />
                            <em style={{
                                fontFamily: "var(--font-serif)", fontStyle: "italic",
                                fontWeight: 400, color: "#e8622c",
                            }}>Feed</em>
                        </h1>
                        <p style={{
                            fontFamily: "var(--font-mono)", fontSize: "12px",
                            lineHeight: 1.6, opacity: 0.4, marginTop: "16px",
                            maxWidth: "420px",
                        }}>
                            Announcements, questions, and advising discussions — moderated by admins.
                        </p>
                    </div>

                    <FeedClient
                        initialPosts={posts}
                        session={session ? { id: user?.id, alias: user?.alias, role: user?.role } : null}
                    />
                </div>

                {/* SIDEBAR */}
                <div style={{
                    padding: "48px 28px", position: "sticky", top: "57px",
                    background: "#111110",
                    minHeight: "calc(100svh - 57px)",
                }}>
                    <div style={{
                        fontFamily: "var(--font-mono)", fontSize: "11px",
                        letterSpacing: "0.14em", textTransform: "uppercase",
                        opacity: 0.4, marginBottom: "24px",
                    }}>
                        Guidelines
                    </div>

                    {[
                        { icon: "◎", title: "Be specific", text: "Ask about a course, faculty, or advising issue clearly." },
                        { icon: "◉", title: "No hate", text: "Personal attacks or disrespectful language will be removed." },
                        { icon: "◈", title: "One topic", text: "Keep each post focused on a single question or issue." },
                        { icon: "◇", title: "Check first", text: "Search the faculty directory before posting a question about a professor." },
                    ].map((g, i) => (
                        <div key={i} style={{
                            paddingBottom: "20px", marginBottom: "20px",
                            borderBottom: i < 3 ? "1px solid #1e1c1a" : "none",
                        }}>
                            <div style={{
                                display: "flex", alignItems: "center", gap: "8px",
                                marginBottom: "6px",
                            }}>
                                <span style={{
                                    fontFamily: "var(--font-mono)", fontSize: "12px",
                                    color: "#e8622c", opacity: 0.7,
                                }}>
                                    {g.icon}
                                </span>
                                <span style={{
                                    fontFamily: "var(--font-sans)", fontSize: "14px",
                                    fontWeight: 700, letterSpacing: "-0.01em",
                                }}>
                                    {g.title}
                                </span>
                            </div>
                            <div style={{
                                fontFamily: "var(--font-mono)", fontSize: "12px",
                                lineHeight: 1.6, opacity: 0.45,
                                paddingLeft: "20px",
                            }}>
                                {g.text}
                            </div>
                        </div>
                    ))}

                    <div style={{
                        marginTop: "32px", padding: "18px",
                        background: "rgba(232,98,44,0.06)",
                        border: "1px solid rgba(232,98,44,0.15)",
                        borderRadius: "2px",
                    }}>
                        <div style={{
                            fontFamily: "var(--font-mono)", fontSize: "11px",
                            letterSpacing: "0.06em", textTransform: "uppercase",
                            color: "#e8622c", opacity: 0.7, marginBottom: "8px",
                            display: "flex", alignItems: "center", gap: "6px",
                        }}>
                            <span style={{ fontSize: "8px" }}>●</span>
                            Moderation
                        </div>
                        <div style={{
                            fontFamily: "var(--font-mono)", fontSize: "12px",
                            lineHeight: 1.6, opacity: 0.5,
                        }}>
                            Posts are moderated by admins. Resolved posts stay visible for reference.
                        </div>
                    </div>

                    {/* Quick stats */}
                    <div style={{
                        marginTop: "28px", padding: "16px 18px",
                        border: "1px solid #1e1c1a",
                    }}>
                        <div style={{
                            display: "flex", justifyContent: "space-between",
                            alignItems: "center",
                        }}>
                            <span style={{
                                fontFamily: "var(--font-mono)", fontSize: "11px",
                                opacity: 0.35, letterSpacing: "0.06em",
                                textTransform: "uppercase",
                            }}>
                                Total posts
                            </span>
                            <span style={{
                                fontFamily: "var(--font-sans)", fontSize: "20px",
                                fontWeight: 800, letterSpacing: "-0.02em",
                            }}>
                                {posts.length}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
        .feed-layout { grid-template-columns: 1fr 340px; }
        @media (max-width: 900px) {
          .feed-layout { grid-template-columns: 1fr !important; }
          .feed-layout > div:last-child { display: none; }
        }
      `}</style>
        </div>
    );
}