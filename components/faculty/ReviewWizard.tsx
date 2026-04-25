"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Faculty, ReviewQuestion, Semester } from "@/types";

interface Props {
    faculty: Faculty;
    questions: ReviewQuestion[];
    semesters: Semester[];
    existingReview: any;
}

export default function ReviewWizard({
    faculty,
    questions,
    semesters,
    existingReview,
}: Props) {
    const router = useRouter();
    const isEditing = !!existingReview;

    // Pre-fill answers if editing
    const prefilled: Record<string, string> = {};
    if (existingReview?.answers) {
        existingReview.answers.forEach((a: any) => {
            prefilled[a.question_id] = a.answer_value || "";
        });
    }

    const [step, setStep] = useState(0); // 0 = semester select, 1..n = questions, last = confirm
    const safeSemesters = semesters ?? [];
    const safeQuestions = questions ?? [];

    const [selectedSemester, setSelectedSemester] = useState<string>(
        existingReview?.semester_id || safeSemesters.find((s) => s.is_active)?.id || ""
    );
    const [answers, setAnswers] = useState<Record<string, string>>(prefilled);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const mcqQuestions = safeQuestions.filter((q) => q.type === "mcq");
    const textQuestion = safeQuestions.find((q) => q.type === "text");
    const totalSteps = mcqQuestions.length + 2; // 0=semester, 1..n=mcq, last=text+confirm

    const currentMcq = step >= 1 && step <= mcqQuestions.length
        ? mcqQuestions[step - 1]
        : null;
    const isTextStep = step === mcqQuestions.length + 1;
    const progress = Math.round((step / (totalSteps - 1)) * 100);

    async function handleSubmit() {
        setSubmitting(true);
        setError(null);

        try {
            const res = await fetch("/api/reviews/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    facultyId: faculty.id,
                    semesterId: selectedSemester || null,
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
                justifyContent: "space-between", borderRight: "1.5px solid #0f0f0f",
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
                            color: "#f5f2eb", opacity: 0.4,
                        }}>
                            {faculty.department}
                        </div>
                    </div>
                </div>

                {/* Warning notice */}
                <div className="wizard-warning-wrapper">
                    <div style={{
                    padding: "16px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    marginBottom: "32px",
                    }}>
                    <div style={{
                        fontFamily: "var(--font-mono)", fontSize: "10px",
                        letterSpacing: "0.1em", textTransform: "uppercase",
                        color: "#d4401a", marginBottom: "10px",
                    }}>
                        Before you review
                    </div>
                    {[
                        "Be honest — your review helps real students",
                        "No personal attacks or offensive language",
                        "You can edit this review anytime after submitting",
                        "One review per faculty — this is yours permanently",
                        "Your identity is never shown publicly",
                    ].map((note, i) => (
                        <div key={i} style={{
                        display: "flex", gap: "8px",
                        alignItems: "flex-start", marginBottom: "6px",
                        }}>
                        <span style={{
                            color: "#f5f2eb", opacity: 0.3,
                            fontFamily: "var(--font-mono)", fontSize: "11px",
                            marginTop: "1px", flexShrink: 0,
                        }}>—</span>
                        <span style={{
                            fontFamily: "var(--font-mono)", fontSize: "11px",
                            color: "#f5f2eb", opacity: 0.45, lineHeight: 1.5,
                        }}>
                            {note}
                        </span>
                        </div>
                    ))}
                    </div>
                </div>

                {/* Progress */}
                <div className="wizard-progress">
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
                        height: "2px", background: "rgba(255,255,255,0.1)",
                        position: "relative",
                    }}>
                        <div style={{
                            position: "absolute", top: 0, left: 0, bottom: 0,
                            width: `${progress}%`, background: "#d4401a",
                            transition: "width 0.4s ease",
                        }} />
                    </div>

                    <div className="step-list" style={{
                        marginTop: "24px", display: "flex",
                        flexDirection: "column", gap: "8px",
                    }}>
                        {["Select semester", ...mcqQuestions.map((q) => q.question_text),
                            "Add a comment",
                        ].map((label, i) => (
                            <div key={i} style={{
                                display: "flex", alignItems: "center", gap: "10px",
                            }}>
                                <div style={{
                                    width: "6px", height: "6px", borderRadius: "50%",
                                    background: i < step ? "#d4401a" : i === step ? "#f5f2eb" : "rgba(255,255,255,0.15)",
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
                <div style={{ maxWidth: "440px", width: "100%" }}>

                    {/* STEP 0 — Semester */}
                    {step === 0 && (
                        <div>
                            <div style={stepLabel}>Step 01</div>
                            <h3 style={questionStyle}>Which semester did you take this faculty?</h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "40px" }}>
                                {safeSemesters.map((s) => (
                                    <button key={s.id}
                                        onClick={() => setSelectedSemester(s.id)}
                                        style={{
                                            ...optionStyle,
                                            background: selectedSemester === s.id ? "#0f0f0f" : "transparent",
                                            color: selectedSemester === s.id ? "#f5f2eb" : "#0f0f0f",
                                        }}>
                                        <span>{s.label}</span>
                                        {s.is_active && (
                                            <span style={{
                                                fontFamily: "var(--font-mono)", fontSize: "10px",
                                                color: selectedSemester === s.id ? "#f5f2eb" : "#1a4fd4",
                                                opacity: 0.7, marginLeft: "8px",
                                            }}>
                                                Current
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                            <button onClick={() => setStep(1)} style={nextBtnStyle}>
                                Next →
                            </button>
                        </div>
                    )}

                    {/* STEP 1..n — MCQ */}
                    {currentMcq && (
                        <div key={currentMcq.id}>
                            <div style={stepLabel}>Step {String(step + 1).padStart(2, "0")}</div>
                            <h3 style={questionStyle}>{currentMcq.question_text}</h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "40px" }}>
                                {(currentMcq.options as string[]).map((opt) => (
                                    <button key={opt}
                                        onClick={() => {
                                            setAnswers((prev) => ({ ...prev, [currentMcq.id]: opt }));
                                        }}
                                        style={{
                                            ...optionStyle,
                                            background: answers[currentMcq.id] === opt ? "#0f0f0f" : "transparent",
                                            color: answers[currentMcq.id] === opt ? "#f5f2eb" : "#0f0f0f",
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
                                    disabled={!answers[currentMcq.id]}
                                    style={{
                                        ...nextBtnStyle,
                                        opacity: answers[currentMcq.id] ? 1 : 0.35,
                                        cursor: answers[currentMcq.id] ? "pointer" : "not-allowed",
                                    }}>
                                    Next →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* LAST STEP — text + submit */}
                    {isTextStep && (
                        <div>
                            <div style={stepLabel}>
                                Step {String(totalSteps).padStart(2, "0")} · Optional
                            </div>
                            <h3 style={questionStyle}>
                                {textQuestion?.question_text || "Any additional comments?"}
                            </h3>
                            <textarea
                                placeholder="Share your experience — this helps other students make better decisions…"
                                value={textQuestion ? (answers[textQuestion.id] || "") : ""}
                                onChange={(e) => {
                                    if (textQuestion) {
                                        setAnswers((prev) => ({
                                            ...prev,
                                            [textQuestion.id]: e.target.value,
                                        }));
                                    }
                                }}
                                rows={5}
                                style={{
                                    width: "100%", fontFamily: "var(--font-mono)",
                                    fontSize: "13px", lineHeight: 1.7,
                                    padding: "16px", border: "1.5px solid #0f0f0f",
                                    background: "transparent", color: "#0f0f0f",
                                    outline: "none", resize: "vertical",
                                    marginBottom: "32px",
                                }}
                            />

                            {/* Summary */}
                            <div style={{
                                border: "1.5px solid #e8e3d9", padding: "20px",
                                marginBottom: "24px", background: "#f5f2eb",
                            }}>
                                <div style={{
                                    fontFamily: "var(--font-mono)", fontSize: "11px",
                                    letterSpacing: "0.1em", textTransform: "uppercase",
                                    opacity: 0.4, marginBottom: "12px",
                                }}>
                                    Your answers
                                </div>
                                {mcqQuestions.map((q) => (
                                    <div key={q.id} style={{
                                        display: "flex", justifyContent: "space-between",
                                        padding: "6px 0", borderBottom: "1px solid #e8e3d9",
                                    }}>
                                        <span style={{
                                            fontFamily: "var(--font-mono)", fontSize: "11px",
                                            opacity: 0.5, maxWidth: "60%",
                                        }}>
                                            {q.question_text}
                                        </span>
                                        <span style={{
                                            fontFamily: "var(--font-mono)", fontSize: "11px",
                                            fontWeight: 500,
                                        }}>
                                            {answers[q.id] || "—"}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {error && (
                                <div style={{
                                    fontFamily: "var(--font-mono)", fontSize: "12px",
                                    color: "#d4401a", border: "1px solid #d4401a",
                                    padding: "12px 16px", marginBottom: "16px",
                                }}>
                                    {error}
                                </div>
                            )}

                            <div style={{ display: "flex", gap: "12px" }}>
                                <button onClick={() => setStep(step - 1)} style={backBtnStyle}>
                                    ← Back
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    style={{
                                        ...nextBtnStyle,
                                        background: submitting ? "#c8c2b4" : "#d4401a",
                                        borderColor: submitting ? "#c8c2b4" : "#d4401a",
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
          
          .wizard-header { order: 1; padding: 72px 24px 16px !important; background: #0f0f0f; }
          .wizard-right { order: 2; flex: 1; padding: 32px 24px !important; justify-content: center !important; }
          .wizard-warning-wrapper { order: 3; padding: 0 24px !important; background: #0f0f0f; }
          .wizard-warning-wrapper > div { margin-bottom: 0 !important; }
          .wizard-progress { order: 4; padding: 16px 24px 32px !important; background: #0f0f0f; }
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
    border: "1.5px solid #0f0f0f", cursor: "pointer",
    fontFamily: "var(--font-mono)", fontSize: "13px",
    letterSpacing: "0.04em", transition: "background 0.12s, color 0.12s",
    display: "flex", alignItems: "center",
};

const nextBtnStyle: React.CSSProperties = {
    fontFamily: "var(--font-mono)", fontSize: "13px",
    fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase",
    padding: "14px 28px", background: "#0f0f0f", color: "#f5f2eb",
    border: "1.5px solid #0f0f0f", cursor: "pointer",
    transition: "background 0.15s",
};

const backBtnStyle: React.CSSProperties = {
    fontFamily: "var(--font-mono)", fontSize: "13px",
    fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase",
    padding: "14px 28px", background: "transparent", color: "#0f0f0f",
    border: "1.5px solid #0f0f0f", cursor: "pointer",
};