"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Reply {
  id: string;
  body: string;
  is_admin: boolean;
  created_at: string;
  user?: { alias: string; avatar_color: string };
  admin?: { display_name: string; avatar_color: string };
}

interface Post {
  id: string;
  body: string;
  status: string;
  created_at: string;
  user?: { alias: string; avatar_color: string };
  admin?: { display_name: string; avatar_color: string };
  replies?: Reply[];
}

interface Props {
  initialPosts: Post[];
  session: { id: string; alias: string; role: string } | null;
}

export default function FeedClient({ initialPosts, session }: Props) {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [reportedIds, setReportedIds] = useState<Set<string>>(new Set());
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [replyingLoading, setReplyingLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(20);

  async function handlePost() {
    if (!body.trim()) return;
    setPosting(true);
    setPostError(null);

    try {
      const res = await fetch("/api/feed/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const newPost: Post = {
        id: data.id,
        body: body.trim(),
        status: "active",
        created_at: new Date().toISOString(),
        user: { alias: session?.alias || "Student", avatar_color: "#e8622c" },
        replies: [],
      };

      setPosts((prev) => [newPost, ...prev]);
      setBody("");
    } catch (e: any) {
      setPostError(e.message);
    } finally {
      setPosting(false);
    }
  }

  async function handleReply(postId: string) {
    if (!replyBody.trim()) return;
    setReplyingLoading(true);

    try {
      const res = await fetch("/api/feed/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, body: replyBody }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const isAdmin = session?.role === "admin";
      const newReply: Reply = {
        id: data.id,
        body: replyBody.trim(),
        is_admin: isAdmin,
        created_at: new Date().toISOString(),
        user: isAdmin
          ? undefined
          : { alias: session?.alias || "Student", avatar_color: "#e8622c" },
      };

      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, replies: [...(p.replies || []), newReply] }
            : p
        )
      );

      setReplyBody("");
      setReplyingTo(null);
    } catch (e: any) {
      console.error(e.message);
    } finally {
      setReplyingLoading(false);
    }
  }

  async function handleReport(postId: string) {
    try {
      const res = await fetch("/api/feed/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
      if (res.ok) setReportedIds((prev) => new Set([...prev, postId]));
    } catch {}
  }

  async function handleDeletePost(postId: string) {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      const res = await fetch("/api/admin/feed/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete post");
      }
    } catch (e: any) {
      alert("Error deleting post");
    }
  }

  function getTimeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric", month: "short", year: "numeric",
    });
  }

  return (
    <div>
      {/* Compose box */}
      {session ? (
        <div style={{
          padding: "28px 32px",
          borderBottom: "1.5px solid #1e1c1a",
          background: "#141312",
        }}>
          <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
            <div style={{
              width: "38px", height: "38px", borderRadius: "50%",
              background: "linear-gradient(135deg, #e8622c, #c4501e)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--font-mono)", fontSize: "13px",
              color: "#f5f2eb", fontWeight: 600, flexShrink: 0,
            }}>
              {session.role === "admin" ? "K" : session.alias?.[0]?.toUpperCase() || "S"}
            </div>
            <div style={{ flex: 1 }}>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                onKeyDown={(e) => {
                  // Submit on Enter only on Desktop (width > 768)
                  if (e.key === "Enter" && !e.shiftKey && typeof window !== 'undefined' && window.innerWidth > 768) {
                    e.preventDefault();
                    handlePost();
                  }
                }}
                placeholder="Ask a question or share an update…"
                rows={3}
                maxLength={500}
                className="feed-textarea"
                style={{
                  width: "100%", fontFamily: "var(--font-mono)",
                  fontSize: "13px", lineHeight: 1.7,
                  padding: "14px 16px", border: "1.5px solid #2a2725",
                  background: "rgba(255,255,255,0.02)", color: "#f5f2eb",
                  outline: "none", resize: "vertical", marginBottom: "12px",
                  borderRadius: "2px",
                  transition: "border-color 0.2s",
                }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{
                  fontFamily: "var(--font-mono)", fontSize: "11px",
                  opacity: body.length > 400 ? 0.7 : 0.3,
                  color: body.length > 450 ? "#e8622c" : "#f5f2eb",
                  transition: "color 0.2s, opacity 0.2s",
                }}>
                  {body.length}/500
                </span>
                <button
                  onClick={handlePost}
                  disabled={posting || body.trim().length < 10}
                  className="feed-post-btn"
                  style={{
                    fontFamily: "var(--font-mono)", fontSize: "12px",
                    fontWeight: 500, letterSpacing: "0.06em",
                    textTransform: "uppercase", padding: "10px 22px",
                    background: posting || body.trim().length < 10 ? "#1e1c1a" : "#e8622c",
                    color: posting || body.trim().length < 10 ? "#555" : "#f5f2eb",
                    border: "none", borderRadius: "2px",
                    cursor: posting || body.trim().length < 10 ? "not-allowed" : "pointer",
                    transition: "background 0.2s, color 0.2s, transform 0.1s",
                  }}>
                  {posting ? "Posting…" : "Post →"}
                </button>
              </div>
              {postError && (
                <div style={{
                  fontFamily: "var(--font-mono)", fontSize: "12px",
                  color: "#f87171", marginTop: "10px",
                  padding: "8px 12px", background: "rgba(248,113,113,0.08)",
                  border: "1px solid rgba(248,113,113,0.2)", borderRadius: "2px",
                }}>
                  {postError}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div style={{
          padding: "24px 32px", borderBottom: "1.5px solid #1e1c1a",
          display: "flex", alignItems: "center",
          justifyContent: "space-between", gap: "16px", flexWrap: "wrap",
          background: "#141312",
        }}>
          <div style={{
            fontFamily: "var(--font-mono)", fontSize: "13px", opacity: 0.5,
            display: "flex", alignItems: "center", gap: "8px",
          }}>
            <span style={{ fontSize: "14px", opacity: 0.4 }}>💬</span>
            Sign in with your EWU email to post.
          </div>
          <a href="/login?callbackUrl=%2Ffeed" style={{
            fontFamily: "var(--font-mono)", fontSize: "12px",
            fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase",
            color: "#f5f2eb", background: "#e8622c",
            padding: "10px 20px", textDecoration: "none", borderRadius: "2px",
          }}>
            Sign in →
          </a>
        </div>
      )}

      {/* Posts */}
      <div>
        {posts.length === 0 ? (
          <div style={{
            padding: "96px 32px", textAlign: "center",
          }}>
            <div style={{
              fontFamily: "var(--font-sans)", fontSize: "28px",
              fontWeight: 800, letterSpacing: "-0.02em",
              opacity: 0.15, marginBottom: "12px",
            }}>
              No posts yet
            </div>
            <div style={{
              fontFamily: "var(--font-mono)", fontSize: "13px",
              opacity: 0.35, lineHeight: 1.6,
            }}>
              Be the first to start a conversation.<br />
              Ask a question or share something useful.
            </div>
          </div>
        ) : (
          posts.slice(0, visibleCount).map((post) => (
            <div key={post.id} className="feed-post" style={{
              borderBottom: "1px solid #1e1c1a",
              transition: "background 0.15s",
            }}>
              {/* Post */}
              <div className="feed-post-inner" style={{ padding: "28px 32px" }}>
                <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                  <div style={{
                    width: "38px", height: "38px", borderRadius: "50%",
                    background: post.admin
                      ? "linear-gradient(135deg, #e8622c, #c4501e)"
                      : (post.user?.avatar_color || "#e8622c"),
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "var(--font-mono)", fontSize: "13px",
                    color: post.admin ? "#f5f2eb" : "#0f0f0f",
                    fontWeight: 600, flexShrink: 0,
                  }}>
                    {post.admin ? "K" : (post.user?.alias?.[0]?.toUpperCase() || "S")}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: "flex", alignItems: "center",
                      gap: "10px", marginBottom: "8px", flexWrap: "wrap",
                    }}>
                      <span style={{
                        fontFamily: "var(--font-mono)", fontSize: "13px",
                        fontWeight: 600, letterSpacing: "0.02em",
                      }}>
                        {post.admin ? post.admin.display_name : (post.user?.alias || "Student")}
                      </span>
                      {post.admin && (
                        <span style={{
                          fontFamily: "var(--font-mono)", fontSize: "9px",
                          letterSpacing: "0.1em", textTransform: "uppercase",
                          background: "rgba(232,98,44,0.15)", color: "#e8622c",
                          padding: "3px 8px", borderRadius: "2px",
                          border: "1px solid rgba(232,98,44,0.2)",
                        }}>
                          Admin
                        </span>
                      )}
                      <span style={{
                        fontFamily: "var(--font-mono)", fontSize: "11px",
                        opacity: 0.3,
                      }}>
                        {getTimeAgo(post.created_at)}
                      </span>
                      {post.status === "resolved" && (
                        <span style={{
                          fontFamily: "var(--font-mono)", fontSize: "10px",
                          letterSpacing: "0.08em", textTransform: "uppercase",
                          color: "#34d399",
                          background: "rgba(52,211,153,0.1)",
                          border: "1px solid rgba(52,211,153,0.2)",
                          padding: "2px 8px", borderRadius: "2px",
                        }}>
                          ✓ Resolved
                        </span>
                      )}
                    </div>

                    <p style={{
                      fontFamily: "var(--font-mono)", fontSize: "13px",
                      lineHeight: 1.75, opacity: 0.8, marginBottom: "14px",
                      wordBreak: "break-word",
                    }}>
                      {post.body}
                    </p>

                    <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                      {session && (
                        <button
                          onClick={() => setReplyingTo(
                            replyingTo === post.id ? null : post.id
                          )}
                          className="feed-action-btn"
                          style={{
                            fontFamily: "var(--font-mono)", fontSize: "11px",
                            letterSpacing: "0.06em", textTransform: "uppercase",
                            background: "none", border: "none", cursor: "pointer",
                            opacity: 0.4, color: "#f5f2eb", padding: "4px 0",
                            transition: "opacity 0.15s",
                          }}>
                          {replyingTo === post.id
                            ? "Cancel"
                            : `Reply${(post.replies?.length ?? 0) > 0 ? ` · ${post.replies?.length}` : ""}`}
                        </button>
                      )}
                      {session && session.role !== "admin" && session.id !== post.user?.alias && (
                        <button
                          onClick={() => handleReport(post.id)}
                          disabled={reportedIds.has(post.id)}
                          className="feed-action-btn"
                          style={{
                            fontFamily: "var(--font-mono)", fontSize: "11px",
                            letterSpacing: "0.06em", textTransform: "uppercase",
                            background: "none", border: "none", cursor: "pointer",
                            opacity: reportedIds.has(post.id) ? 0.2 : 0.25,
                            color: "#f5f2eb", padding: "4px 0",
                            transition: "opacity 0.15s",
                          }}>
                          {reportedIds.has(post.id) ? "Reported ✓" : "Report"}
                        </button>
                      )}
                      {session && session.role === "admin" && (
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="feed-action-btn"
                          style={{
                            fontFamily: "var(--font-mono)", fontSize: "11px",
                            letterSpacing: "0.06em", textTransform: "uppercase",
                            background: "none", border: "none", cursor: "pointer",
                            opacity: 0.5,
                            color: "#ef4444", padding: "4px 0",
                            transition: "opacity 0.15s",
                          }}>
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Replies */}
              {(post.replies?.length ?? 0) > 0 && (
                <div className="feed-replies-list" style={{
                  marginLeft: "84px", marginRight: "32px",
                  borderLeft: "2px solid rgba(232,98,44,0.2)",
                  marginBottom: "16px",
                }}>
                  {post.replies?.map((reply) => (
                    <div key={reply.id} style={{
                      padding: "14px 20px",
                      borderBottom: "1px solid #141312",
                    }}>
                      <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                        <div style={{
                          width: "28px", height: "28px", borderRadius: "50%",
                          background: reply.is_admin
                            ? "linear-gradient(135deg, #e8622c, #c4501e)"
                            : (reply.user?.avatar_color || "#e8622c"),
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontFamily: "var(--font-mono)", fontSize: "11px",
                          color: reply.is_admin ? "#f5f2eb" : "#0f0f0f",
                          fontWeight: 600, flexShrink: 0,
                        }}>
                          {reply.is_admin ? "K" : reply.user?.alias?.[0]?.toUpperCase() || "S"}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            display: "flex", alignItems: "center",
                            gap: "8px", marginBottom: "4px",
                          }}>
                            <span style={{
                              fontFamily: "var(--font-mono)", fontSize: "12px",
                              fontWeight: 600,
                              color: reply.is_admin ? "#e8622c" : "#f5f2eb",
                            }}>
                              {reply.is_admin ? (reply.admin?.display_name || "Know_Your_Faculty") : (reply.user?.alias || "Student")}
                            </span>
                            {reply.is_admin && (
                              <span style={{
                                fontFamily: "var(--font-mono)", fontSize: "9px",
                                letterSpacing: "0.1em", textTransform: "uppercase",
                                background: "rgba(232,98,44,0.15)", color: "#e8622c",
                                padding: "2px 6px", borderRadius: "2px",
                              }}>
                                Admin
                              </span>
                            )}
                            <span style={{
                              fontFamily: "var(--font-mono)", fontSize: "11px", opacity: 0.3,
                            }}>
                              {getTimeAgo(reply.created_at)}
                            </span>
                          </div>
                          <p style={{
                            fontFamily: "var(--font-mono)", fontSize: "12px",
                            lineHeight: 1.65, opacity: 0.75,
                            wordBreak: "break-word",
                          }}>
                            {reply.body}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply box */}
              {replyingTo === post.id && session && (
                <div className="feed-reply-container" style={{
                  marginLeft: "84px", marginRight: "32px",
                  marginBottom: "20px", display: "flex", gap: "10px",
                }}>
                  <textarea
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    onKeyDown={(e) => {
                      // Submit on Enter only on Desktop (width > 768)
                      if (e.key === "Enter" && !e.shiftKey && typeof window !== 'undefined' && window.innerWidth > 768) {
                        e.preventDefault();
                        handleReply(post.id);
                      }
                    }}
                    placeholder={
                      session.role === "admin"
                        ? "Reply as Know_Your_Faculty…"
                        : "Write a reply…"
                    }
                    rows={1}
                    className="feed-reply-textarea"
                    style={{
                      flex: 1, fontFamily: "var(--font-mono)", fontSize: "13px",
                      padding: "10px 14px", border: "1.5px solid #2a2725",
                      background: "rgba(255,255,255,0.02)", color: "#f5f2eb",
                      outline: "none", resize: "none", borderRadius: "2px",
                      lineHeight: 1.5, minHeight: "40px",
                      transition: "border-color 0.2s",
                    }}
                  />
                  <button
                    onClick={() => handleReply(post.id)}
                    disabled={replyingLoading || replyBody.trim().length < 2}
                    style={{
                      fontFamily: "var(--font-mono)", fontSize: "11px",
                      letterSpacing: "0.06em", textTransform: "uppercase",
                      padding: "10px 18px", borderRadius: "2px",
                      background: replyingLoading ? "#1e1c1a" : "#e8622c",
                      color: replyingLoading ? "#555" : "#f5f2eb",
                      border: "none", cursor: "pointer",
                      transition: "background 0.2s",
                    }}>
                    {replyingLoading ? "…" : "Send"}
                  </button>
                </div>
              )}
            </div>
          ))
        )}

        {posts.length > visibleCount && (
          <div style={{ padding: "32px", textAlign: "center" }}>
            <button
              onClick={() => setVisibleCount(prev => prev + 20)}
              style={{
                fontFamily: "var(--font-mono)", fontSize: "12px",
                letterSpacing: "0.08em", textTransform: "uppercase",
                background: "transparent", border: "1.5px solid #2a2725",
                color: "#f5f2eb", padding: "14px 40px", cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseOver={(e) => (e.currentTarget.style.borderColor = "#e8622c")}
              onMouseOut={(e) => (e.currentTarget.style.borderColor = "#2a2725")}
            >
              See more posts ({posts.length - visibleCount} left)
            </button>
          </div>
        )}
      </div>

      <style>{`
        .feed-textarea:focus {
          border-color: #e8622c !important;
        }
        .feed-reply-textarea:focus {
          border-color: #e8622c !important;
        }
        .feed-post:hover {
          background: rgba(255,255,255,0.015);
        }
        .feed-action-btn:hover {
          opacity: 0.7 !important;
        }
        .feed-post-btn:hover:not(:disabled) {
          transform: translateY(-1px);
        }
        @media (max-width: 640px) {
          .feed-post-inner { padding: 20px 16px !important; }
          .feed-replies-list, .feed-reply-container { 
            margin-left: 48px !important; 
            margin-right: 16px !important; 
          }
        }
      `}</style>
    </div>
  );
}