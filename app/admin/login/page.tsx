"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleLogin() {
        if (!email.trim() || !password.trim()) {
            setError("Email and password are required.");
            return;
        }

        setLoading(true);
        setError(null);

        const res = await signIn("admin-credentials", {
            email,
            password,
            redirect: false,
        });

        if (res?.error) {
            setError("Invalid email or password.");
            setLoading(false);
            return;
        }

        router.push("/admin");
        router.refresh();
    }

    return (
        <div style={{
            minHeight: "100svh", background: "#f5f2eb",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "32px",
        }}>
            <div style={{ width: "100%", maxWidth: "380px" }}>

                {/* Logo */}
                <div style={{
                    fontFamily: "var(--font-mono)", fontSize: "13px",
                    fontWeight: 500, letterSpacing: "0.08em",
                    textTransform: "uppercase", color: "#0f0f0f",
                    marginBottom: "48px",
                }}>
                    Know Your <span style={{ color: "#e8622c" }}>Faculty</span>
                    <span style={{
                        marginLeft: "12px", fontFamily: "var(--font-mono)",
                        fontSize: "10px", letterSpacing: "0.1em",
                        background: "#e8622c", color: "#0f0f0f",
                        padding: "2px 8px",
                    }}>
                        ADMIN
                    </span>
                </div>

                <h1 style={{
                    fontFamily: "var(--font-sans)", fontSize: "36px",
                    fontWeight: 800, letterSpacing: "-0.03em",
                    lineHeight: 1, color: "#0f0f0f", marginBottom: "8px",
                }}>
                    Admin login
                </h1>
                <p style={{
                    fontFamily: "var(--font-mono)", fontSize: "13px",
                    color: "#0f0f0f", opacity: 0.4,
                    lineHeight: 1.6, marginBottom: "40px",
                }}>
                    Restricted access. Admin credentials only.
                </p>

                {/* Email */}
                <div style={{ marginBottom: "14px" }}>
                    <div style={{
                        fontFamily: "var(--font-mono)", fontSize: "11px",
                        letterSpacing: "0.1em", textTransform: "uppercase",
                        color: "#0f0f0f", opacity: 0.4, marginBottom: "8px",
                    }}>
                        Email
                    </div>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                        placeholder="admin@kyf.com"
                        style={{
                            width: "100%", fontFamily: "var(--font-mono)",
                            fontSize: "13px", padding: "13px 16px",
                            border: "1.5px solid rgba(255,255,255,0.15)",
                            background: "rgba(255,255,255,0.05)",
                            color: "#0f0f0f", outline: "none",
                            letterSpacing: "0.02em",
                        }}
                    />
                </div>

                {/* Password */}
                <div style={{ marginBottom: "28px" }}>
                    <div style={{
                        fontFamily: "var(--font-mono)", fontSize: "11px",
                        letterSpacing: "0.1em", textTransform: "uppercase",
                        color: "#0f0f0f", opacity: 0.4, marginBottom: "8px",
                    }}>
                        Password
                    </div>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                        placeholder="••••••••"
                        style={{
                            width: "100%", fontFamily: "var(--font-mono)",
                            fontSize: "13px", padding: "13px 16px",
                            border: "1.5px solid rgba(255,255,255,0.15)",
                            background: "rgba(255,255,255,0.05)",
                            color: "#0f0f0f", outline: "none",
                        }}
                    />
                </div>

                {error && (
                    <div style={{
                        fontFamily: "var(--font-mono)", fontSize: "12px",
                        color: "#e8622c", border: "1px solid #e8622c",
                        padding: "12px 16px", marginBottom: "20px",
                    }}>
                        {error}
                    </div>
                )}

                <button
                    onClick={handleLogin}
                    disabled={loading}
                    style={{
                        width: "100%", fontFamily: "var(--font-mono)",
                        fontSize: "13px", fontWeight: 500,
                        letterSpacing: "0.06em", textTransform: "uppercase",
                        padding: "15px", background: loading ? "#333" : "#0f0f0f",
                        color: "#f5f2eb", border: "none",
                        cursor: loading ? "not-allowed" : "pointer",
                        transition: "background 0.15s",
                    }}>
                    {loading ? "Signing in…" : "Sign in →"}
                </button>

                <div style={{ marginTop: "32px", textAlign: "center" }}>
                    <a href="/" style={{
                        fontFamily: "var(--font-mono)", fontSize: "11px",
                        letterSpacing: "0.08em", textTransform: "uppercase",
                        color: "#0f0f0f", opacity: 0.25, textDecoration: "none",
                    }}>
                        ← Back to site
                    </a>
                </div>
            </div>
        </div>
    );
}