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
                display: "grid", gridTemplateColumns: "1fr 320px",
                alignItems: "start", minHeight: "calc(100svh - 57px)",
            }} className="feed-layout">

                {/* MAIN */}
                <div style={{ borderRight: "1.5px solid #2a2725" }}>

                    {/* Header */}
                    <div style={{
                        padding: "56px 32px 40px",
                        borderBottom: "1.5px solid #d4401a",
                    }}>
                        <div style={{
                            fontFamily: "var(--font-mono)", fontSize: "11px",
                            letterSpacing: "0.14em", textTransform: "uppercase",
                            opacity: 0.4, marginBottom: "16px",
                        }}>
                            {posts.length} post{posts.length !== 1 ? "s" : ""}
                        </div>
                        <h1 style={{
                            fontFamily: "var(--font-sans)",
                            fontSize: "clamp(36px, 5vw, 64px)",
                            fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 0.95,
                        }}>
                            Community<br />
                            <em style={{
                                fontFamily: "var(--font-serif)", fontStyle: "italic",
                                fontWeight: 400, color: "#d4401a",
                            }}>Feed</em>
                        </h1>
                    </div>

                    <FeedClient
                        initialPosts={posts}
                        session={session ? { id: user?.id, alias: user?.alias, role: user?.role } : null}
                    />
                </div>

                {/* SIDEBAR */}
                <div style={{ padding: "48px 28px", position: "sticky", top: "57px" }}>
                    <div style={{
                        fontFamily: "var(--font-mono)", fontSize: "11px",
                        letterSpacing: "0.14em", textTransform: "uppercase",
                        opacity: 0.4, marginBottom: "24px",
                    }}>
                        Guidelines
                    </div>

                    {[
                        { title: "Be specific", text: "Ask about a course, faculty, or advising issue clearly." },
                        { title: "No hate", text: "Personal attacks or disrespectful language will be removed." },
                        { title: "One topic", text: "Keep each post focused on a single question or issue." },
                        { title: "Check first", text: "Search the faculty directory before posting a question about a professor." },
                    ].map((g, i) => (
                        <div key={i} style={{
                            paddingBottom: "20px", marginBottom: "20px",
                            borderBottom: i < 3 ? "1px solid #2a2725" : "none",
                        }}>
                            <div style={{
                                fontFamily: "var(--font-sans)", fontSize: "14px",
                                fontWeight: 700, letterSpacing: "-0.01em", marginBottom: "6px",
                            }}>
                                {g.title}
                            </div>
                            <div style={{
                                fontFamily: "var(--font-mono)", fontSize: "12px",
                                lineHeight: 1.6, opacity: 0.5,
                            }}>
                                {g.text}
                            </div>
                        </div>
                    ))}

                    <div style={{
                        marginTop: "32px", padding: "16px",
                        background: "#1a1917", border: "1.5px solid #2a2725",
                    }}>
                        <div style={{
                            fontFamily: "var(--font-mono)", fontSize: "11px",
                            letterSpacing: "0.06em", textTransform: "uppercase",
                            opacity: 0.5, marginBottom: "6px",
                        }}>
                            Moderation
                        </div>
                        <div style={{
                            fontFamily: "var(--font-mono)", fontSize: "12px",
                            lineHeight: 1.6, opacity: 0.6,
                        }}>
                            Posts are moderated by admins. Resolved posts stay visible for reference.
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
        .feed-layout { grid-template-columns: 1fr 320px; }
        @media (max-width: 900px) {
          .feed-layout { grid-template-columns: 1fr !important; }
          .feed-layout > div:last-child { display: none; }
        }
      `}</style>
        </div>
    );
}