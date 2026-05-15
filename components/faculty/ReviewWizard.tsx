"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Faculty } from "@/types";

interface Props {
    faculty: Faculty;
    questions: any[]; // kept for backwards compat, not used
    semesters: any[]; // kept for backwards compat, not used
    existingReview: any;
}

// Static question keys — stored as answer_value in the DB
const QUESTIONS = [
    { key: "course", label: "Which course did you take with this faculty?", type: "text" as const },
    { key: "attendance", label: "Strict about attendance?", type: "yn" as const },
    { key: "grading", label: "Fair grading?", type: "yn" as const },
    { key: "teaching", label: "Clear teaching?", type: "yn" as const },
    { key: "recommend", label: "Do you recommend this faculty?", type: "yd" as const },
] as const;

const PRECAUTION_ITEMS = [
    "Be honest — your review should reflect your real experience",
    "Your identity is anonymous. No one will know it's you",
    "Your review could literally save someone's semester",
    "You can edit this review anytime — it's yours forever",
    "No personal attacks. Keep it respectful, keep it real",
    "Don't sugarcoat it. If it was bad, say it was bad",
];

export default function ReviewWizard({
    faculty,
    existingReview,
}: Props) {
    const router = useRouter();
    const isEditing = !!existingReview;

    // Pre-fill from existing review
    const prefilled: Record<string, string> = {};
    if (existingReview?.answers) {
        existingReview.answers.forEach((a: any) => {
            const q = a.question;
            if (q) {
                const matchedKey = QUESTIONS.find(
                    (sq) => sq.label.toLowerCase() === q.question_text?.toLowerCase()
                )?.key;
                if (matchedKey) {
                    prefilled[matchedKey] = a.answer_value || "";
                } else if (q.type === "text") {
                    prefilled["comment"] = a.answer_value || "";
                }
            }
        });
    }

    // Steps: 0=precaution, 1=course, 2=attendance, 3=grading, 4=teaching, 5=recommend, 6=comment+submit
    const [step, setStep] = useState(isEditing ? 1 : 0);
    const [accepted, setAccepted] = useState(isEditing);

    const [answers, setAnswers] = useState<Record<string, string>>(prefilled);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const totalSteps = 7; // 0=precaution, 1=course, 2-5=MCQ, 6=comment+submit
    const progress = step === 0 ? 0 : Math.round((step / (totalSteps - 1)) * 100);

    const currentQuestion = step >= 2 && step <= 5 ? QUESTIONS[step - 1] : null;

    const stepLabels = [
        "Accept guidelines",
        ...QUESTIONS.map((q) => q.label),
        "Final comment",
    ];

    async function handleSubmit() {
        setSubmitting(true);
        setError(null);

        try {
            const res = await fetch("/api/reviews/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    facultyId: faculty.id,
                    answers,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Submission failed");

            router.push(`/faculty/${faculty.id}?submitted=1`);
            router.refresh();
        } catch (e: any) {
            setError(e.message);
            setSubmitting(false);
        }
    }

    return (
        <div style={{
            minHeight: "calc(100svh - 57px)",
            display: "grid", gridTemplateColumns: "1fr 1fr",
        }} className="wizard-grid">

            {/* LEFT — context panel */}
            <div style={{
                background: "#0f0f0f", padding: "56px 48px",
                display: "flex", flexDirection: "column",
                justifyContent: "space-between", borderRight: "1.5px solid #e8622c",
            }} className="wizard-left">
                <div className="wizard-header">
                    <div style={{ marginBottom: "32px" }}>
                        <Link href={`/faculty/${faculty.id}`} style={{
                            fontFamily: "var(--font-mono)", fontSize: "11px",
                            letterSpacing: "0.1em", textTransform: "uppercase",
                            color: "#f5f2eb", opacity: 0.4, textDecoration: "none",
                        }}>
                            ← Back to profile
                        </Link>
                    </div>

                    <div>
                        <div style={{
                            fontFamily: "var(--font-mono)", fontSize: "11px",
                            letterSpacing: "0.14em", textTransform: "uppercase",
                            color: "#f5f2eb", opacity: 0.4, marginBottom: "12px",
                        }}>
                            {isEditing ? "Editing review for" : "Reviewing"}
                        </div>
                        <h2 style={{
                            fontFamily: "var(--font-sans)",
                            fontSize: "clamp(28px, 3.5vw, 48px)",
                            fontWeight: 800, letterSpacing: "-0.03em",
                            lineHeight: 1, color: "#f5f2eb", marginBottom: "8px",
                        }}>
                            {faculty.name}
                        </h2>
                        <div style={{
                            fontFamily: "var(--font-mono)", fontSize: "12px",
                            letterSpacing: "0.08em", textTransform: "uppercase",
                            color: "#f5f2eb", opacity: 0.6,
                        }}>
                            {faculty.department}
                        </div>
                    </div>
                </div>

                {/* Progress */}
                <div className="wizard-progress" style={{ opacity: step === 0 ? 0.3 : 1, transition: "opacity 0.3s" }}>
                    <div style={{
                        display: "flex", justifyContent: "space-between",
                        fontFamily: "var(--font-mono)", fontSize: "11px",
                        letterSpacing: "0.06em", color: "#f5f2eb",
                        opacity: 0.4, marginBottom: "8px",
                    }}>
                        <span>Progress</span>
                        <span>{progress}%</span>
                    </div>
                    <div style={{
                        height: "2px", position: "relative", background: "rgba(255,255,255,0.1)",
                    }}>
                        <div style={{
                            position: "absolute", top: 0, left: 0, bottom: 0,
                            width: `${progress}%`, background: "#e8622c",
                            transition: "width 0.4s ease",
                        }} />
                    </div>

                    <div className="step-list" style={{
                        marginTop: "24px", display: "flex",
                        flexDirection: "column", gap: "8px",
                    }}>
                        {stepLabels.map((label, i) => (
                            <div key={i} style={{
                                display: "flex", alignItems: "center", gap: "10px",
                            }}>
                                <div style={{
                                    width: "6px", height: "6px", borderRadius: "50%",
                                    background: i < step ? "#e8622c" : i === step ? "#f5f2eb" : "rgba(255,255,255,0.15)",
                                    flexShrink: 0, transition: "background 0.3s",
                                }} />
                                <span style={{
                                    fontFamily: "var(--font-mono)", fontSize: "11px",
                                    letterSpacing: "0.06em", color: "#f5f2eb",
                                    opacity: i === step ? 0.9 : 0.3,
                                    transition: "opacity 0.3s",
                                    whiteSpace: "nowrap", overflow: "hidden",
                                    textOverflow: "ellipsis", maxWidth: "260px",
                                }}>
                                    {label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* RIGHT — question panel */}
            <div style={{
                display: "flex", flexDirection: "column",
                justifyContent: "center", padding: "56px 48px",
            }} className="wizard-right">
                <div style={{ maxWidth: "480px", width: "100%" }}>

                    {/* STEP 0 — Precautions */}
                    {step === 0 && (
                        <div>
                            <div style={stepLabel}>Before you begin</div>
                            <h3 style={{
                                ...questionStyle,
                                fontSize: "clamp(24px, 3vw, 36px)",
                            }}>
                                Hold up.{" "}
                                <em style={{
                                    fontFamily: "var(--font-serif)", fontStyle: "italic",
                                    fontWeight: 400, color: "#e8622c",
                                }}>Read this first.</em>
                            </h3>

                            <div style={{
                                display: "flex", flexDirection: "column", gap: "16px",
                                marginBottom: "40px",
                            }}>
                                {PRECAUTION_ITEMS.map((item, i) => (
                                    <div key={i} style={{
                                        display: "flex", alignItems: "flex-start", gap: "12px",
                                        padding: "14px 18px",
                                        border: "1.5px solid rgba(0, 0, 0, 0.12)",
                                        background: i === 2 ? "#e8622c" : "transparent",
                                        color: i === 2 ? "#f5f2eb" : "#f5f2eb",
                                    }}>
                                        <span style={{
                                            fontFamily: "var(--font-mono)", fontSize: "11px",
                                            opacity: 0.3, marginTop: "2px", flexShrink: 0,
                                        }}>—</span>
                                        <span style={{
                                            fontFamily: "var(--font-mono)", fontSize: "13px",
                                            lineHeight: 1.6, opacity: 0.85,
                                        }}>
                                            {item}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => { setAccepted(true); setStep(1); }}
                                style={{
                                    ...nextBtnStyle,
                                    width: "100%", textAlign: "center",
                                    background: "#e8622c", borderColor: "#e8622c",
                                }}>
                                I understand, let&apos;s go →
                            </button>
                        </div>
                    )}

                    {/* STEP 1 — Course (text input) */}
                    {step === 1 && accepted && (
                        <div>
                            <div style={stepLabel}>Step 01</div>
                            <h3 style={questionStyle}>Which course did you take with this faculty?</h3>
                            <input
                                type="text"
                                value={answers["course"] || ""}
                                onChange={(e) => setAnswers((p) => ({ ...p, course: e.target.value }))}
                                placeholder="e.g. CSE 110, ENG 101, MAT 120…"
                                style={{
                                    width: "100%", fontFamily: "var(--font-mono)",
                                    fontSize: "14px", padding: "16px 18px",
                                    border: "1.5px solid #2a2725", background: "transparent",
                                    color: "#f5f2eb", outline: "none",
                                    marginBottom: "40px",
                                }}
                            />
                            <div style={{ display: "flex", gap: "12px" }}>
                                {!isEditing && (
                                    <button onClick={() => setStep(0)} style={backBtnStyle}>
                                        ← Back
                                    </button>
                                )}
                                <button
                                    onClick={() => setStep(2)}
                                    disabled={!answers["course"]?.trim()}
                                    style={{
                                        ...nextBtnStyle,
                                        opacity: answers["course"]?.trim() ? 1 : 0.35,
                                        cursor: answers["course"]?.trim() ? "pointer" : "not-allowed",
                                    }}>
                                    Next →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEPS 2–5 — MCQ questions (Yes/No or Yes/Drop) */}
                    {currentQuestion && (currentQuestion.type === "yn" || currentQuestion.type === "yd") && (
                        <div key={currentQuestion.key}>
                            <div style={stepLabel}>Step {String(step).padStart(2, "0")}</div>
                            <h3 style={questionStyle}>{currentQuestion.label}</h3>
                            <div style={{ display: "flex", gap: "12px", marginBottom: "40px" }}>
                                {(currentQuestion.type === "yd" ? ["Yes", "Drop"] : ["Yes", "No"]).map((opt) => (
                                    <button key={opt}
                                        onClick={() => setAnswers((p) => ({ ...p, [currentQuestion.key]: opt }))}
                                        style={{
                                            ...optionStyle,
                                            flex: 1, justifyContent: "center",
                                            background: answers[currentQuestion.key] === opt
                                                ? (opt === "Drop" ? "#ef4444" : "#e8622c")
                                                : "transparent",
                                            color: "#f5f2eb",
                                            borderColor: answers[currentQuestion.key] === opt
                                                ? (opt === "Drop" ? "#ef4444" : "#e8622c")
                                                : "#2a2725",
                                            fontSize: "15px", fontWeight: 600,
                                            padding: "20px 18px",
                                        }}>
                                        {opt}
                                    </button>
                                ))}
                            </div>
                            <div style={{ display: "flex", gap: "12px" }}>
                                <button onClick={() => setStep(step - 1)} style={backBtnStyle}>
                                    ← Back
                                </button>
                                <button
                                    onClick={() => setStep(step + 1)}
                                    disabled={!answers[currentQuestion.key]}
                                    style={{
                                        ...nextBtnStyle,
                                        opacity: answers[currentQuestion.key] ? 1 : 0.35,
                                        cursor: answers[currentQuestion.key] ? "pointer" : "not-allowed",
                                    }}>
                                    Next →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 6 — Optional comment + submit */}
                    {step === 6 && (
                        <div>
                            <div style={stepLabel}>Step 06 · Optional</div>
                            <h3 style={questionStyle}>
                                Anything else you want to say?
                            </h3>
                            <textarea
                                placeholder="Share your experience — the good, the bad, and the ugly…"
                                value={answers["comment"] || ""}
                                onChange={(e) => setAnswers((p) => ({ ...p, comment: e.target.value }))}
                                rows={4}
                                style={{
                                    width: "100%", fontFamily: "var(--font-mono)",
                                    fontSize: "13px", lineHeight: 1.7,
                                    padding: "16px", border: "1.5px solid #2a2725",
                                    background: "transparent", color: "#f5f2eb",
                                    outline: "none", resize: "vertical",
                                    marginBottom: "28px",
                                }}
                            />

                            {/* Summary */}
                            <div style={{
                                border: "1.5px solid #2a2725", padding: "20px",
                                marginBottom: "24px", background: "#1a1917",
                            }}>
                                <div style={{
                                    fontFamily: "var(--font-mono)", fontSize: "11px",
                                    letterSpacing: "0.1em", textTransform: "uppercase",
                                    opacity: 0.4, marginBottom: "12px",
                                }}>
                                    Your answers
                                </div>
                                {QUESTIONS.map((q) => (
                                    <div key={q.key} style={{
                                        display: "flex", justifyContent: "space-between",
                                        padding: "6px 0", borderBottom: "1px solid #2a2725",
                                    }}>
                                        <span style={{
                                            fontFamily: "var(--font-mono)", fontSize: "11px",
                                            opacity: 0.5, maxWidth: "60%",
                                        }}>
                                            {q.label}
                                        </span>
                                        <span style={{
                                            fontFamily: "var(--font-mono)", fontSize: "11px",
                                            fontWeight: 500,
                                            color: (q.type === "yn" || q.type === "yd")
                                                ? answers[q.key] === "Yes" ? "#34d399" : (answers[q.key] === "No" || answers[q.key] === "Drop") ? "#f87171" : "#f5f2eb"
                                                : "#f5f2eb",
                                        }}>
                                            {answers[q.key] || "—"}
                                        </span>
                                    </div>
                                ))}
                                {answers["comment"] && (
                                    <div style={{
                                        marginTop: "10px", padding: "10px 0 0",
                                    }}>
                                        <div style={{
                                            fontFamily: "var(--font-mono)", fontSize: "10px",
                                            letterSpacing: "0.1em", textTransform: "uppercase",
                                            opacity: 0.35, marginBottom: "4px",
                                        }}>
                                            Comment
                                        </div>
                                        <div style={{
                                            fontFamily: "var(--font-mono)", fontSize: "12px",
                                            opacity: 0.65, lineHeight: 1.6,
                                        }}>
                                            {answers["comment"]}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {error && (
                                <div style={{
                                    fontFamily: "var(--font-mono)", fontSize: "12px",
                                    color: "#e8622c", border: "1px solid #e8622c",
                                    padding: "12px 16px", marginBottom: "16px",
                                }}>
                                    {error}
                                </div>
                            )}

                            <div style={{ display: "flex", gap: "12px" }}>
                                <button onClick={() => setStep(5)} style={backBtnStyle}>
                                    ← Back
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    style={{
                                        ...nextBtnStyle,
                                        background: submitting ? "#c8c2b4" : "#e8622c",
                                        borderColor: submitting ? "#c8c2b4" : "#e8622c",
                                        flex: 1,
                                    }}>
                                    {submitting
                                        ? "Submitting…"
                                        : isEditing
                                            ? "Update review"
                                            : "Submit review"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
        .wizard-grid { grid-template-columns: 1fr 1fr; }
        .wizard-left { display: flex; }
        @media (max-width: 768px) {
          .wizard-grid { display: flex !important; flex-direction: column !important; min-height: 100svh !important; }
          .wizard-left { display: contents !important; }
          
          .wizard-header { order: 1; padding: 72px 24px 16px !important; background: #0f0f0f; border-bottom: 1.5px solid #e8622c; }
          .wizard-right { order: 2; flex: 1; padding: 32px 24px !important; justify-content: center !important; }
          .wizard-progress { order: 4; padding: 16px 24px 32px !important; background: #0f0f0f; border-top: 1.5px solid #e8622c; }
          .step-list { display: none !important; }
        }
      `}</style>
        </div>
    );
}

const stepLabel: React.CSSProperties = {
    fontFamily: "var(--font-mono)", fontSize: "11px",
    letterSpacing: "0.14em", textTransform: "uppercase",
    opacity: 0.4, marginBottom: "12px",
};

const questionStyle: React.CSSProperties = {
    fontFamily: "var(--font-sans)", fontSize: "clamp(20px, 2.5vw, 28px)",
    fontWeight: 800, letterSpacing: "-0.02em",
    lineHeight: 1.1, marginBottom: "32px",
};

const optionStyle: React.CSSProperties = {
    width: "100%", textAlign: "left", padding: "14px 18px",
    border: "1.5px solid #2a2725", cursor: "pointer",
    fontFamily: "var(--font-mono)", fontSize: "13px",
    letterSpacing: "0.04em", transition: "background 0.12s, color 0.12s",
    display: "flex", alignItems: "center",
};

const nextBtnStyle: React.CSSProperties = {
    fontFamily: "var(--font-mono)", fontSize: "13px",
    fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase",
    padding: "14px 28px", background: "#e8622c", color: "#f5f2eb",
    border: "1.5px solid #e8622c", cursor: "pointer",
    transition: "background 0.15s",
};

const backBtnStyle: React.CSSProperties = {
    fontFamily: "var(--font-mono)", fontSize: "13px",
    fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase",
    padding: "14px 28px", background: "transparent", color: "#f5f2eb",
    border: "1.5px solid #f5f2eb", cursor: "pointer",
};