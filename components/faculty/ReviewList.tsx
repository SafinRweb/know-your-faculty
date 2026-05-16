"use client";

import { useState } from "react";

interface Props {
    textReviews: any[];
}

export default function ReviewList({ textReviews }: Props) {
    const [expanded, setExpanded] = useState(false);

    if (textReviews.length === 0) {
        return (
            <div style={{
                fontFamily: "var(--font-mono)", fontSize: "13px",
                opacity: 0.4, lineHeight: 1.6,
            }}>
                No written comments yet for this period.
            </div>
        );
    }

    const visibleReviews = expanded ? textReviews : textReviews.slice(0, 4);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            {visibleReviews.map((review: any, i: number) => {
                const textAnswer = review.answers?.find(
                    (a: any) => a.question?.type === "text" && a.question?.question_text !== "Which course did you take with this faculty?" && a.answer_value?.trim()
                );
                const courseAnswer = review.answers?.find(
                    (a: any) => a.question?.question_text === "Which course did you take with this faculty?" && a.answer_value?.trim()
                );
                
                if (!textAnswer) return null;
                
                return (
                    <div key={review.id} style={{
                        padding: "28px 0",
                        borderBottom: i < visibleReviews.length - 1
                            ? "1px solid #2a2725" : "none",
                    }}>
                        <div style={{
                            display: "flex", alignItems: "center",
                            gap: "12px", marginBottom: "12px",
                        }}>
                            <div style={{
                                width: "28px", height: "28px",
                                background: review.user?.avatar_color || "#e8622c", borderRadius: "50%",
                                display: "flex", alignItems: "center",
                                justifyContent: "center",
                                fontFamily: "var(--font-mono)", fontSize: "11px",
                                color: "#0f0f0f", flexShrink: 0,
                            }}>
                                {review.user?.alias?.[0]?.toUpperCase() || "S"}
                            </div>
                            <div>
                                <div style={{
                                    fontFamily: "var(--font-mono)", fontSize: "12px",
                                    fontWeight: 500, letterSpacing: "0.04em",
                                }}>
                                    {review.user?.alias || "Student"}
                                </div>
                                <div style={{
                                    fontFamily: "var(--font-mono)", fontSize: "11px",
                                    opacity: 0.4, letterSpacing: "0.04em",
                                }}>
                                    {new Date(review.created_at).toLocaleDateString("en-GB", {
                                        month: "short", year: "numeric",
                                    })}
                                    {courseAnswer ? ` · ${courseAnswer.answer_value}` : ""}
                                </div>
                            </div>
                        </div>
                        <p style={{
                            fontFamily: "var(--font-mono)", fontSize: "13px",
                            lineHeight: 1.7, opacity: 0.75,
                            paddingLeft: "40px",
                        }}>
                            {textAnswer.answer_value}
                        </p>
                    </div>
                );
            })}

            {!expanded && textReviews.length > 4 && (
                <button 
                    onClick={() => setExpanded(true)}
                    style={{
                        marginTop: "16px", padding: "12px 24px",
                        background: "transparent", color: "#f5f2eb",
                        border: "1.5px solid #2a2725",
                        fontFamily: "var(--font-mono)", fontSize: "11px",
                        letterSpacing: "0.06em", textTransform: "uppercase",
                        cursor: "pointer", transition: "all 0.2s",
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.borderColor = "#f5f2eb";
                        e.currentTarget.style.opacity = "1";
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.borderColor = "#2a2725";
                        e.currentTarget.style.opacity = "0.7";
                    }}
                >
                    See more ({textReviews.length - 4})
                </button>
            )}
        </div>
    );
}
