"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function Navbar() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const { data: session } = useSession();
    const user = session?.user as any;

    return (
        <>
            <nav style={{
                position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "18px 32px",
                background: "#0f0f0f",
                borderBottom: "1.5px solid #f5f2eb",
            }}>
                <Link href="/" style={{
                    fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 500,
                    letterSpacing: "0.08em", textTransform: "uppercase",
                    color: "#f5f2eb", textDecoration: "none",
                }}>
                    Know Your <span style={{ color: "#e8622c" }}>Faculty</span>
                </Link>

                {/* Desktop links */}
                <ul style={{
                    display: "flex", alignItems: "center",
                    gap: "32px", listStyle: "none",
                }} className="desktop-nav">
                    <li><Link href="/schedule" style={navLinkStyle}>Schedule</Link></li>
                    <li><Link href="/faculty" style={navLinkStyle}>Faculty</Link></li>
                    <li><Link href="/feed" style={navLinkStyle}>Feed</Link></li>
                    <li>
                        {session ? (
                            <div style={{ position: "relative" }}>
                                <button
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                    style={{
                                        fontFamily: "var(--font-mono)", fontSize: "12px",
                                        fontWeight: 500, letterSpacing: "0.06em",
                                        textTransform: "uppercase", background: "#f5f2eb",
                                        color: "#0f0f0f", padding: "9px 18px",
                                        border: "1.5px solid #f5f2eb", cursor: "pointer",
                                        display: "flex", alignItems: "center", gap: "8px",
                                    }}>
                                    {user?.alias || user?.email?.split("@")[0] || "Student"}
                                    <span style={{ opacity: 0.5, fontSize: "10px" }}>▾</span>
                                </button>

                                {dropdownOpen && (
                                    <div style={{
                                        position: "absolute", top: "calc(100% + 8px)", right: 0,
                                        background: "#f5f2eb", border: "1.5px solid #f5f2eb",
                                        minWidth: "180px", zIndex: 200,
                                    }}>
                                        <div style={{
                                            padding: "12px 16px",
                                            borderBottom: "1px solid rgba(255,255,255,0.1)",
                                        }}>
                                            <div style={{
                                                fontFamily: "var(--font-mono)", fontSize: "10px",
                                                letterSpacing: "0.1em", textTransform: "uppercase",
                                                color: "#0f0f0f", opacity: 0.4, marginBottom: "4px",
                                            }}>
                                                Signed in as
                                            </div>
                                            <div style={{
                                                fontFamily: "var(--font-mono)", fontSize: "12px",
                                                color: "#0f0f0f", opacity: 0.8,
                                                overflow: "hidden", textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                            }}>
                                                {user?.email}
                                            </div>
                                        </div>

                                        {user?.role === "admin" && (
                                            <Link href="/admin" onClick={() => setDropdownOpen(false)}
                                                style={dropdownItemStyle}>
                                                Admin Panel
                                            </Link>
                                        )}

                                        <button
                                            onClick={() => { signOut({ callbackUrl: "/" }); setDropdownOpen(false); }}
                                            style={{
                                                ...dropdownItemStyle, width: "100%",
                                                textAlign: "left", background: "none",
                                                border: "none", cursor: "pointer",
                                                color: "#e8622c",
                                            }}>
                                            Sign out
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link href="/login" style={{
                                ...navLinkStyle, opacity: 1,
                                background: "#f5f2eb", color: "#0f0f0f",
                                padding: "9px 18px",
                            }}>
                                Sign in
                            </Link>
                        )}
                    </li>
                </ul>

                {/* Burger */}
                <button
                    onClick={() => setMobileOpen(true)}
                    className="burger-btn"
                    style={{
                        display: "none", flexDirection: "column", gap: "5px",
                        background: "none", border: "none", cursor: "pointer", padding: "4px",
                    }}>
                    <span style={{ display: "block", width: "22px", height: "1.5px", background: "#f5f2eb" }} />
                    <span style={{ display: "block", width: "22px", height: "1.5px", background: "#f5f2eb" }} />
                </button>
            </nav>

            {/* Click outside to close dropdown */}
            {dropdownOpen && (
                <div
                    onClick={() => setDropdownOpen(false)}
                    style={{ position: "fixed", inset: 0, zIndex: 99 }}
                />
            )}

            {/* Mobile overlay */}
            {mobileOpen && (
                <div style={{
                    position: "fixed", inset: 0, background: "#0f0f0f",
                    zIndex: 200, display: "flex", flexDirection: "column",
                    justifyContent: "center", alignItems: "flex-start",
                    padding: "48px 32px", gap: "8px",
                    animation: "slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                }}>
                    <button
                        onClick={() => setMobileOpen(false)}
                        style={{
                            position: "absolute", top: "20px", right: "24px",
                            fontFamily: "var(--font-mono)", fontSize: "12px",
                            letterSpacing: "0.1em", textTransform: "uppercase",
                            color: "#f5f2eb", opacity: 0.4,
                            background: "none", border: "none", cursor: "pointer",
                        }}>
                        Close ×
                    </button>

                    {[
                        { href: "/schedule", label: "Schedule" },
                        { href: "/faculty", label: "Faculty" },
                        { href: "/feed", label: "Feed" },
                    ].map((item) => (
                        <Link key={item.href} href={item.href}
                            onClick={() => setMobileOpen(false)}
                            style={{
                                fontFamily: "var(--font-sans)", fontSize: "36px",
                                fontWeight: 800, letterSpacing: "-0.03em",
                                color: "#f5f2eb", textDecoration: "none",
                                opacity: 0.5, padding: "8px 0",
                            }}>
                            {item.label}
                        </Link>
                    ))}

                    {session ? (
                        <button
                            onClick={() => { signOut({ callbackUrl: "/" }); setMobileOpen(false); }}
                            style={{
                                fontFamily: "var(--font-sans)", fontSize: "36px",
                                fontWeight: 800, letterSpacing: "-0.03em",
                                color: "#e8622c", background: "none",
                                border: "none", cursor: "pointer", padding: "8px 0",
                            }}>
                            Sign out
                        </button>
                    ) : (
                        <Link href="/login" onClick={() => setMobileOpen(false)}
                            style={{
                                fontFamily: "var(--font-sans)", fontSize: "36px",
                                fontWeight: 800, letterSpacing: "-0.03em",
                                color: "#e8622c", textDecoration: "none", padding: "8px 0",
                            }}>
                            Sign in →
                        </Link>
                    )}
                </div>
            )}

            <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @media (max-width: 900px) {
          .desktop-nav { display: none !important; }
          .burger-btn { display: flex !important; }
        }
      `}</style>
        </>
    );
}

const navLinkStyle: React.CSSProperties = {
    fontFamily: "var(--font-mono)", fontSize: "12px", fontWeight: 500,
    letterSpacing: "0.06em", textTransform: "uppercase",
    color: "#f5f2eb", textDecoration: "none", opacity: 0.55,
};

const dropdownItemStyle: React.CSSProperties = {
    display: "block", padding: "12px 16px",
    fontFamily: "var(--font-mono)", fontSize: "12px",
    letterSpacing: "0.06em", textTransform: "uppercase",
    color: "#0f0f0f", textDecoration: "none",
    opacity: 0.7, transition: "opacity 0.15s",
};