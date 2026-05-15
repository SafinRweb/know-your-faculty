"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

import { Suspense } from "react";

function LoginContent() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") || "/";

    async function handleGoogleSignIn() {
        setLoading(true);
        setError(null);
        try {
            await signIn("google", { callbackUrl });
        } catch {
            setError("Something went wrong. Please try again.");
            setLoading(false);
        }
    }

    return (
        <div style={{
            minHeight: "100svh", background: "#0f0f0f",
            display: "grid", gridTemplateColumns: "1fr 1fr",
        }} className="login-grid">

            {/* LEFT — branding panel */}
            <div style={{
                background: "#f5f2eb", padding: "48px",
                display: "flex", flexDirection: "column",
                justifyContent: "space-between",
                borderRight: "1.5px solid #f5f2eb",
            }} className="login-left">

                <Link href="/" style={{
                    fontFamily: "var(--font-mono)", fontSize: "13px",
                    fontWeight: 500, letterSpacing: "0.08em",
                    textTransform: "uppercase", color: "#0f0f0f",
                    textDecoration: "none", opacity: 0.6,
                }}>
                    ← Know Your <span style={{ color: "#e8622c" }}>Faculty</span>
                </Link>

                <div>
                    <h1 style={{
                        fontFamily: "var(--font-sans)",
                        fontSize: "clamp(40px, 5vw, 72px)",
                        fontWeight: 800, lineHeight: 0.92,
                        letterSpacing: "-0.03em", color: "#0f0f0f",
                        marginBottom: "32px",
                    }}>
                        Your voice<br />
                        shapes the<br />
                        <em style={{
                            fontFamily: "var(--font-serif)", fontStyle: "italic",
                            fontWeight: 400, color: "#e8622c",
                        }}>next semester.</em>
                    </h1>
                    <p style={{
                        fontFamily: "var(--font-mono)", fontSize: "13px",
                        lineHeight: 1.7, color: "#0f0f0f", opacity: 0.5,
                        maxWidth: "360px",
                    }}>
                        Sign in with your EWU student email to submit reviews,
                        edit them anytime, and help the next student make a
                        better advising decision.
                    </p>
                </div>

                {/* Policy notes */}
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {[
                        "Only @std.ewubd.edu emails are accepted",
                        "One review per faculty — yours to edit anytime",
                        "Your identity is never shown publicly",
                    ].map((note, i) => (
                        <div key={i} style={{
                            display: "flex", alignItems: "flex-start", gap: "10px",
                        }}>
                            <span style={{
                                width: "5px", height: "5px", borderRadius: "50%",
                                background: "#e8622c", marginTop: "5px", flexShrink: 0,
                                display: "inline-block",
                            }} />
                            <span style={{
                                fontFamily: "var(--font-mono)", fontSize: "11px",
                                letterSpacing: "0.06em", color: "#0f0f0f", opacity: 0.45,
                                lineHeight: 1.6,
                            }}>
                                {note}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* RIGHT — sign in panel */}
            <div style={{
                display: "flex", flexDirection: "column",
                justifyContent: "center", alignItems: "center",
                padding: "48px",
            }}>
                <div style={{ width: "100%", maxWidth: "380px" }}>

                    {/* Header */}
                    <div style={{
                        fontFamily: "var(--font-mono)", fontSize: "11px",
                        letterSpacing: "0.14em", textTransform: "uppercase",
                        opacity: 0.4, marginBottom: "12px",
                    }}>
                        Student Access
                    </div>
                    <h2 style={{
                        fontFamily: "var(--font-sans)", fontSize: "32px",
                        fontWeight: 800, letterSpacing: "-0.03em",
                        lineHeight: 1.05, marginBottom: "8px",
                    }}>
                        Sign in
                    </h2>
                    <p style={{
                        fontFamily: "var(--font-mono)", fontSize: "13px",
                        lineHeight: 1.65, opacity: 0.5, marginBottom: "48px",
                    }}>
                        Use your EWU student Google account.<br />
                        Personal Gmail accounts won't work.
                    </p>

                    {/* Error */}
                    {error && (
                        <div style={{
                            fontFamily: "var(--font-mono)", fontSize: "12px",
                            color: "#e8622c", border: "1px solid #e8622c",
                            padding: "12px 16px", marginBottom: "24px",
                            letterSpacing: "0.04em",
                        }}>
                            {error}
                        </div>
                    )}

                    {/* Google sign in button */}
                    <button
                        onClick={handleGoogleSignIn}
                        disabled={loading}
                        style={{
                            width: "100%", display: "flex",
                            alignItems: "center", justifyContent: "center", gap: "12px",
                            padding: "16px 24px",
                            background: loading ? "#2a2725" : "#f5f2eb",
                            color: loading ? "#f5f2eb" : "#0f0f0f",
                            border: "1.5px solid #f5f2eb",
                            fontFamily: "var(--font-mono)", fontSize: "13px",
                            fontWeight: 500, letterSpacing: "0.06em",
                            textTransform: "uppercase", cursor: loading ? "not-allowed" : "pointer",
                            transition: "background 0.15s, color 0.15s",
                            marginBottom: "16px",
                        }}
                    >
                        {/* Google icon */}
                        {!loading && (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                        )}
                        {loading ? "Redirecting…" : "Continue with Google"}
                    </button>

                    {/* Divider */}
                    <div style={{
                        display: "flex", alignItems: "center", gap: "12px",
                        marginBottom: "16px",
                    }}>
                        <div style={{ flex: 1, height: "1px", background: "#c8c2b4" }} />
                        <span style={{
                            fontFamily: "var(--font-mono)", fontSize: "11px",
                            opacity: 0.4, letterSpacing: "0.06em",
                        }}>
                            EWU email only
                        </span>
                        <div style={{ flex: 1, height: "1px", background: "#c8c2b4" }} />
                    </div>

                    {/* Email hint */}
                    <div style={{
                        padding: "14px 16px",
                        border: "1px solid #2a2725",
                        background: "#2a2725",
                    }}>
                        <div style={{
                            fontFamily: "var(--font-mono)", fontSize: "11px",
                            letterSpacing: "0.06em", opacity: 0.5, marginBottom: "4px",
                            textTransform: "uppercase",
                        }}>
                            Accepted format
                        </div>
                        <div style={{
                            fontFamily: "var(--font-mono)", fontSize: "13px",
                            letterSpacing: "0.02em",
                        }}>
                            yourname@std.ewubd.edu
                        </div>
                    </div>

                    {/* Back link */}
                    <div style={{ marginTop: "40px", textAlign: "center" }}>
                        <Link href="/" style={{
                            fontFamily: "var(--font-mono)", fontSize: "11px",
                            letterSpacing: "0.08em", textTransform: "uppercase",
                            color: "#f5f2eb", opacity: 0.4, textDecoration: "none",
                        }}>
                            ← Back to home
                        </Link>
                    </div>
                </div>
            </div>

            <style>{`
        @media (max-width: 768px) {
          .login-grid { grid-template-columns: 1fr !important; }
          .login-left { display: none !important; }
        }
      `}</style>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div style={{ minHeight: "100svh", background: "#0f0f0f" }} />}>
            <LoginContent />
        </Suspense>
    );
}