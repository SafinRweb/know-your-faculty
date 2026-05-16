"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

const AVATAR_COLORS = [
  "#f5f2eb", "#e8622c", "#1a4fd4", "#2a7a4f",
  "#8b2fc9", "#c4841a", "#1a8bc4", "#c41a6b",
];

const ADJECTIVES = ["Silent", "Mystic", "Clever", "Brave", "Night", "Hidden", "Wandering", "Cosmic", "Neon", "Phantom"];
const NOUNS = ["Panda", "Tiger", "Owl", "Fox", "Wolf", "Raven", "Bear", "Phoenix", "Dragon", "Leopard"];

function generateAnonymousName() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${adj}_${noun}_${Math.floor(Math.random() * 100)}`;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const user = session?.user as any;

  const [alias, setAlias] = useState("");
  const [color, setColor] = useState(AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize alias on mount to avoid hydration mismatch
  useEffect(() => {
    if (!alias) {
      setAlias(generateAnonymousName());
    }
    
    // Failsafe: check if user is already setup in the DB
    async function verifySetupStatus() {
      try {
        const res = await fetch("/api/user/status");
        if (res.ok) {
          const { isSetup, alias, avatarColor } = await res.json();
          if (isSetup) {
            await update({ isSetup: true, alias, avatarColor });
            router.push("/");
          }
        }
      } catch (e) {
        // ignore
      }
    }
    verifySetupStatus();
  }, []);

  async function handleSave() {
    if (!alias.trim()) {
      setError("Display name cannot be empty.");
      return;
    }
    if (alias.trim().length < 3) {
      setError("Display name must be at least 3 characters.");
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(alias.trim())) {
      setError("Only letters, numbers, and underscores allowed.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/user/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alias: alias.trim(), avatarColor: color }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");

      // Refresh session so isSetup updates
      await update({ isSetup: true, alias: alias.trim(), avatarColor: color });
      router.push("/");
      router.refresh();
    } catch (e: any) {
      setError(e.message);
      setSaving(false);
    }
  }

  return (
    <div style={{
      minHeight: "100svh", background: "#0f0f0f",
      display: "grid", gridTemplateColumns: "1fr 1fr",
    }} className="onboard-grid">

      {/* LEFT */}
      <div style={{
        background: "#f5f2eb", padding: "56px 48px",
        display: "flex", flexDirection: "column",
        justifyContent: "space-between",
      }} className="onboard-left">
        <div style={{
          fontFamily: "var(--font-mono)", fontSize: "13px",
          fontWeight: 500, letterSpacing: "0.08em",
          textTransform: "uppercase", color: "#0f0f0f", opacity: 0.4,
        }}>
          Know Your <span style={{ color: "#e8622c" }}>Faculty</span>
        </div>

        <div>
          <h1 style={{
            fontFamily: "var(--font-sans)",
            fontSize: "clamp(36px, 4.5vw, 60px)",
            fontWeight: 800, letterSpacing: "-0.03em",
            lineHeight: 0.95, color: "#0f0f0f", marginBottom: "24px",
          }}>
            One last<br />
            <em style={{
              fontFamily: "var(--font-serif)", fontStyle: "italic",
              fontWeight: 400, color: "#e8622c",
            }}>step.</em>
          </h1>
          <p style={{
            fontFamily: "var(--font-mono)", fontSize: "13px",
            lineHeight: 1.7, color: "#0f0f0f", opacity: 0.5,
            maxWidth: "340px",
          }}>
            Set a display name that will appear on your reviews.
            Your real name and email are never shown publicly.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {[
            "Your real identity stays private",
            "Alias can be changed later in settings",
            "Letters, numbers, underscores only",
          ].map((note, i) => (
            <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
              <span style={{
                width: "5px", height: "5px", borderRadius: "50%",
                background: "#e8622c", marginTop: "5px", flexShrink: 0,
                display: "inline-block",
              }} />
              <span style={{
                fontFamily: "var(--font-mono)", fontSize: "11px",
                color: "#0f0f0f", opacity: 0.4, lineHeight: 1.6,
              }}>
                {note}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT */}
      <div style={{
        display: "flex", flexDirection: "column",
        justifyContent: "center", padding: "56px 48px",
      }}>
        <div style={{ maxWidth: "400px", width: "100%" }}>

          <div style={{
            fontFamily: "var(--font-mono)", fontSize: "11px",
            letterSpacing: "0.14em", textTransform: "uppercase",
            opacity: 0.4, marginBottom: "32px",
          }}>
            Profile setup
          </div>

          {/* Avatar preview */}
          <div style={{
            display: "flex", alignItems: "center",
            gap: "20px", marginBottom: "40px",
          }}>
            <div style={{
              width: "64px", height: "64px", borderRadius: "50%",
              background: color, display: "flex",
              alignItems: "center", justifyContent: "center",
              fontFamily: "var(--font-sans)", fontSize: "24px",
              fontWeight: 800, color: "#0f0f0f",
              transition: "background 0.2s",
              flexShrink: 0,
            }}>
              {alias?.[0]?.toUpperCase() || "?"}
            </div>
            <div>
              <div style={{
                fontFamily: "var(--font-sans)", fontSize: "18px",
                fontWeight: 700, letterSpacing: "-0.02em",
                marginBottom: "4px",
              }}>
                {alias || "your_alias"}
              </div>
              <div style={{
                fontFamily: "var(--font-mono)", fontSize: "11px",
                opacity: 0.4, letterSpacing: "0.06em",
              }}>
                This is how you appear on reviews
              </div>
            </div>
          </div>

          {/* Alias input */}
          <div style={{ marginBottom: "28px" }}>
            <div style={{
              fontFamily: "var(--font-mono)", fontSize: "11px",
              letterSpacing: "0.1em", textTransform: "uppercase",
              opacity: 0.4, marginBottom: "8px",
            }}>
              Display name
            </div>
            <input
              type="text"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              placeholder="e.g. night_owl_cse"
              maxLength={24}
              style={{
                width: "100%", fontFamily: "var(--font-mono)",
                fontSize: "14px", padding: "13px 16px",
                border: "1.5px solid #f5f2eb", background: "transparent",
                color: "#f5f2eb", outline: "none", letterSpacing: "0.02em",
              }}
            />
            <div style={{
              fontFamily: "var(--font-mono)", fontSize: "11px",
              opacity: 0.35, marginTop: "6px",
            }}>
              {alias.length}/24 characters
            </div>
          </div>

          {/* Color picker */}
          <div style={{ marginBottom: "40px" }}>
            <div style={{
              fontFamily: "var(--font-mono)", fontSize: "11px",
              letterSpacing: "0.1em", textTransform: "uppercase",
              opacity: 0.4, marginBottom: "12px",
            }}>
              Avatar color
            </div>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {AVATAR_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  style={{
                    width: "36px", height: "36px", borderRadius: "50%",
                    background: c, border: color === c
                      ? "3px solid #f5f2eb" : "3px solid transparent",
                    cursor: "pointer", outline: color === c
                      ? "2px solid #0f0f0f" : "none",
                    outlineOffset: "1px",
                    transition: "border 0.15s",
                  }}
                />
              ))}
            </div>
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
            onClick={handleSave}
            disabled={saving}
            style={{
              width: "100%", fontFamily: "var(--font-mono)",
              fontSize: "13px", fontWeight: 500,
              letterSpacing: "0.06em", textTransform: "uppercase",
              padding: "16px", background: saving ? "#c8c2b4" : "#f5f2eb",
              color: "#0f0f0f", border: "none",
              cursor: saving ? "not-allowed" : "pointer",
            }}>
            {saving ? "Saving…" : "Save & continue →"}
          </button>
        </div>
      </div>

      <style>{`
        .onboard-grid { grid-template-columns: 1fr 1fr; }
        .onboard-left { display: flex; }
        @media (max-width: 768px) {
          .onboard-grid { grid-template-columns: 1fr !important; }
          .onboard-left { display: none !important; }
        }
      `}</style>
    </div>
  );
}
