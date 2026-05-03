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
        user: { alias: session?.alias || "Student", avatar_color: "#d4401a" },
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
          : { alias: session?.alias || "Student", avatar_color: "#d4401a" },
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

  return (
    <div>
      {/* Compose box */}
      {session ? (
        <div style={{ padding: "28px 32px", borderBottom: "1.5px solid #2a2725" }}>
          <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
            <div style={{
              width: "36px", height: "36px", borderRadius: "50%",
              background: "#d4401a", display: "flex",
              alignItems: "center", justifyContent: "center",
              fontFamily: "var(--font-mono)", fontSize: "13px",
              color: "#0f0f0f", flexShrink: 0,
            }}>
              {session.role === "admin" ? "K" : session.alias?.[0]?.toUpperCase() || "S"}
            </div>
            <div style={{ flex: 1 }}>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Ask a question or share an update…"
                rows={3}
                maxLength={500}
                style={{
                  width: "100%", fontFamily: "var(--font-mono)",
                  fontSize: "13px", lineHeight: 1.7,
                  padding: "12px 14px", border: "1.5px solid #2a2725",
                  background: "transparent", color: "#f5f2eb",
                  outline: "none", resize: "vertical", marginBottom: "10px",
                }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", opacity: 0.35 }}>
                  {body.length}/500
                </span>
                <button
                  onClick={handlePost}
                  disabled={posting || body.trim().length < 10}
                  style={{
                    fontFamily: "var(--font-mono)", fontSize: "12px",
                    fontWeight: 500, letterSpacing: "0.06em",
                    textTransform: "uppercase", padding: "10px 20px",
                    background: posting || body.trim().length < 10 ? "#1a1917" : "#d4401a",
                    color: "#0f0f0f", border: "none",
                    cursor: posting || body.trim().length < 10 ? "not-allowed" : "pointer",
                  }}>
                  {posting ? "Posting…" : "Post"}
                </button>
              </div>
              {postError && (
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "#d4401a", marginTop: "8px" }}>
                  {postError}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div style={{
          padding: "24px 32px", borderBottom: "1.5px solid #2a2725",
          display: "flex", alignItems: "center",
          justifyContent: "space-between", gap: "16px", flexWrap: "wrap",
        }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "13px", opacity: 0.5 }}>
            Sign in with your EWU email to post.
          </div>
          <a href="/login" style={{
            fontFamily: "var(--font-mono)", fontSize: "12px",
            fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase",
            color: "#0f0f0f", background: "#d4401a",
            padding: "10px 20px", textDecoration: "none",
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
            fontFamily: "var(--font-mono)", fontSize: "13px", opacity: 0.4,
          }}>
            No posts yet. Be the first to post.
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} style={{
              borderBottom: "1.5px solid #2a2725",
            }}>
              {/* Post */}
              <div style={{ padding: "28px 32px" }}>
                <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                  <div style={{
                    width: "36px", height: "36px", borderRadius: "50%",
                    background: post.admin ? post.admin.avatar_color : (post.user?.avatar_color || "#d4401a"),
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "var(--font-mono)", fontSize: "13px",
                    color: "#0f0f0f", flexShrink: 0,
                  }}>
                    {post.admin ? "K" : (post.user?.alias?.[0]?.toUpperCase() || "S")}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: "flex", alignItems: "center",
                      gap: "10px", marginBottom: "8px", flexWrap: "wrap",
                    }}>
                      <span style={{
                        fontFamily: "var(--font-mono)", fontSize: "12px",
                        fontWeight: 500, letterSpacing: "0.04em",
                      }}>
                        {post.admin ? post.admin.display_name : (post.user?.alias || "Student")}
                      </span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", opacity: 0.35 }}>
                        {new Date(post.created_at).toLocaleDateString("en-GB", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </span>
                      {post.status === "resolved" && (
                        <span style={{
                          fontFamily: "var(--font-mono)", fontSize: "10px",
                          letterSpacing: "0.08em", textTransform: "uppercase",
                          color: "#1a4fd4", border: "1px solid #1a4fd4",
                          padding: "2px 7px",
                        }}>
                          Resolved
                        </span>
                      )}
                    </div>

                    <p style={{
                      fontFamily: "var(--font-mono)", fontSize: "13px",
                      lineHeight: 1.7, opacity: 0.8, marginBottom: "12px",
                    }}>
                      {post.body}
                    </p>

                    <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                      {session && (
                        <button
                          onClick={() => setReplyingTo(
                            replyingTo === post.id ? null : post.id
                          )}
                          style={{
                            fontFamily: "var(--font-mono)", fontSize: "11px",
                            letterSpacing: "0.06em", textTransform: "uppercase",
                            background: "none", border: "none", cursor: "pointer",
                            opacity: 0.45, color: "#f5f2eb", padding: "0",
                          }}>
                          {replyingTo === post.id ? "Cancel" : `Reply${(post.replies?.length ?? 0) > 0 ? ` (${post.replies?.length})` : ""}`}
                        </button>
                      )}
                      {session && session.id !== post.user?.alias && (
                        <button
                          onClick={() => handleReport(post.id)}
                          disabled={reportedIds.has(post.id)}
                          style={{
                            fontFamily: "var(--font-mono)", fontSize: "11px",
                            letterSpacing: "0.06em", textTransform: "uppercase",
                            background: "none", border: "none", cursor: "pointer",
                            opacity: reportedIds.has(post.id) ? 0.2 : 0.3,
                            color: "#f5f2eb", padding: "0",
                          }}>
                          {reportedIds.has(post.id) ? "Reported" : "Report"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Replies */}
              {(post.replies?.length ?? 0) > 0 && (
                <div style={{
                  marginLeft: "80px", marginRight: "32px",
                  borderLeft: "2px solid #2a2725",
                  marginBottom: "16px",
                }}>
                  {post.replies?.map((reply) => (
                    <div key={reply.id} style={{
                      padding: "16px 20px",
                      borderBottom: "1px solid #1a1917",
                    }}>
                      <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                        <div style={{
                          width: "28px", height: "28px", borderRadius: "50%",
                          background: reply.is_admin ? "#d4401a" : (reply.user?.avatar_color || "#d4401a"),
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontFamily: "var(--font-mono)", fontSize: "11px",
                          color: "#0f0f0f", flexShrink: 0,
                        }}>
                          {reply.is_admin ? "K" : reply.user?.alias?.[0]?.toUpperCase() || "S"}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            display: "flex", alignItems: "center",
                            gap: "8px", marginBottom: "4px",
                          }}>
                            <span style={{
                              fontFamily: "var(--font-mono)", fontSize: "12px",
                              fontWeight: 500,
                              color: reply.is_admin ? "#d4401a" : "#f5f2eb",
                            }}>
                              {reply.is_admin ? (reply.admin?.display_name || "Know_Your_Faculty") : (reply.user?.alias || "Student")}
                            </span>
                            {reply.is_admin && (
                              <span style={{
                                fontFamily: "var(--font-mono)", fontSize: "9px",
                                letterSpacing: "0.1em", textTransform: "uppercase",
                                background: "#d4401a", color: "#0f0f0f",
                                padding: "2px 6px",
                              }}>
                                Admin
                              </span>
                            )}
                            <span style={{
                              fontFamily: "var(--font-mono)", fontSize: "11px", opacity: 0.35,
                            }}>
                              {new Date(reply.created_at).toLocaleDateString("en-GB", {
                                day: "numeric", month: "short",
                              })}
                            </span>
                          </div>
                          <p style={{
                            fontFamily: "var(--font-mono)", fontSize: "12px",
                            lineHeight: 1.6, opacity: 0.75,
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
                <div style={{
                  marginLeft: "80px", marginRight: "32px",
                  marginBottom: "20px", display: "flex", gap: "10px",
                }}>
                  <input
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleReply(post.id);
                      }
                    }}
                    placeholder={
                      session.role === "admin"
                        ? "Reply as Know_Your_Faculty…"
                        : "Write a reply…"
                    }
                    style={{
                      flex: 1, fontFamily: "var(--font-mono)", fontSize: "13px",
                      padding: "10px 14px", border: "1.5px solid #2a2725",
                      background: "transparent", color: "#f5f2eb", outline: "none",
                    }}
                  />
                  <button
                    onClick={() => handleReply(post.id)}
                    disabled={replyingLoading || replyBody.trim().length < 2}
                    style={{
                      fontFamily: "var(--font-mono)", fontSize: "11px",
                      letterSpacing: "0.06em", textTransform: "uppercase",
                      padding: "10px 16px",
                      background: replyingLoading ? "#1a1917" : "#d4401a",
                      color: "#0f0f0f", border: "none", cursor: "pointer",
                    }}>
                    {replyingLoading ? "…" : "Send"}
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}