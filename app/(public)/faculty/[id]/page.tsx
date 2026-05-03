import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getFacultyById, getFacultyAnalytics, getFacultyReviews, getFacultyReviewCount } from "@/lib/db/faculty";
import { getAllSemesters } from "@/lib/db/semesters";
import { getFacultySections } from "@/lib/db/sections";
import { getUserReviewForFaculty } from "@/lib/db/reviews";
import AnalyticsBlock from "@/components/faculty/AnalyticsBlock";

export default async function FacultyProfilePage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ semester?: string }>;
}) {
    const [resolvedParams, resolvedSearch] = await Promise.all([
        params,
        searchParams,
    ]);

    const [faculty, semesters, session] = await Promise.all([
        getFacultyById(resolvedParams.id),
        getAllSemesters(),
        auth(),
    ]);

    if (!faculty) notFound();

    const selectedSemesterId = resolvedSearch.semester || undefined;

    const [analytics, reviews, sections, reviewCount, userReview] =
        await Promise.all([
            getFacultyAnalytics(faculty.id, selectedSemesterId),
            getFacultyReviews(faculty.id, selectedSemesterId),
            getFacultySections(faculty.id),
            getFacultyReviewCount(faculty.id),
            session?.user
                ? getUserReviewForFaculty((session.user as any).id, faculty.id)
                : Promise.resolve(null),
        ]);

    const MIN_REVIEWS = 3;
    const hasEnoughReviews = reviewCount >= MIN_REVIEWS;

    const textReviews = reviews.filter((r) =>
        r.answers?.some(
            (a: any) => a.question?.type === "text" && a.answer_value?.trim()
        )
    );

    return (
        <div style={{ paddingTop: "57px" }}>

            {/* HEADER */}
            <div style={{
                padding: "56px 32px 40px",
                borderBottom: "1.5px solid #d4401a",
                display: "grid", gridTemplateColumns: "1fr auto",
                alignItems: "start", gap: "32px",
            }} className="profile-header">
                <div>
                    <div style={{
                        fontFamily: "var(--font-mono)", fontSize: "11px",
                        letterSpacing: "0.14em", textTransform: "uppercase",
                        opacity: 0.4, marginBottom: "12px",
                        display: "flex", alignItems: "center", gap: "8px",
                    }}>
                        <Link href="/faculty" style={{ color: "inherit", textDecoration: "none" }}>
                            Faculty
                        </Link>
                        <span>/</span>
                        <span>{faculty.department}</span>
                    </div>

                    <h1 style={{
                        fontFamily: "var(--font-sans)",
                        fontSize: "clamp(32px, 4.5vw, 60px)",
                        fontWeight: 800, letterSpacing: "-0.03em",
                        lineHeight: 1, marginBottom: "12px",
                    }}>
                        {faculty.name}
                    </h1>

                    <div style={{
                        display: "flex", alignItems: "center", gap: "16px",
                        flexWrap: "wrap",
                    }}>
                        <span style={{
                            fontFamily: "var(--font-mono)", fontSize: "12px",
                            letterSpacing: "0.08em", textTransform: "uppercase",
                            background: "#2a2725", padding: "5px 10px",
                        }}>
                            {faculty.department}
                        </span>
                        {faculty.initial && (
                            <span style={{
                                fontFamily: "var(--font-mono)", fontSize: "12px",
                                letterSpacing: "0.08em", textTransform: "uppercase",
                                background: "#d4401a", color: "#f5f2eb",
                                padding: "4px 10px",
                            }}>
                                {faculty.initial}
                            </span>
                        )}
                        <span style={{
                            fontFamily: "var(--font-mono)", fontSize: "12px",
                            opacity: 0.4, letterSpacing: "0.06em",
                        }}>
                            {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
                        </span>
                    </div>
                </div>

                {/* Review CTA */}
                <div style={{ textAlign: "right" }}>
                    {!session ? (
                        <Link href={`/login?callbackUrl=/faculty/${faculty.id}/review`} style={ctaButtonStyle("#f5f2eb", "#0f0f0f")}>
                            Log in to review
                        </Link>
                    ) : userReview ? (
                        <Link href={`/faculty/${faculty.id}/review`} style={ctaButtonStyle("#1a4fd4", "#0f0f0f")}>
                            Edit your review →
                        </Link>
                    ) : (
                        <Link href={`/faculty/${faculty.id}/review`} style={ctaButtonStyle("#f5f2eb", "#0f0f0f")}>
                            Write a review →
                        </Link>
                    )}
                </div>
            </div>

            {/* SEMESTER TABS */}
            {semesters.length > 0 && (
                <div style={{
                    display: "flex", gap: "0",
                    borderBottom: "1.5px solid #f5f2eb",
                    overflowX: "auto", padding: "0 32px",
                }}>
                    <Link
                        href={`/faculty/${faculty.id}`}
                        style={{
                            ...tabStyle,
                            background: !selectedSemesterId ? "#f5f2eb" : "transparent",
                            color: !selectedSemesterId ? "#0f0f0f" : "#f5f2eb",
                        }}>
                        All time
                    </Link>
                    {semesters.map((s) => (
                        <Link
                            key={s.id}
                            href={`/faculty/${faculty.id}?semester=${s.id}`}
                            style={{
                                ...tabStyle,
                                background: selectedSemesterId === s.id ? "#f5f2eb" : "transparent",
                                color: selectedSemesterId === s.id ? "#0f0f0f" : "#f5f2eb",
                            }}>
                            {s.label}
                            {s.is_active && (
                                <span style={{
                                    width: "5px", height: "5px", borderRadius: "50%",
                                    background: "#1a4fd4", display: "inline-block", marginLeft: "6px",
                                }} />
                            )}
                        </Link>
                    ))}
                </div>
            )}

            <div style={{
                display: "grid", gridTemplateColumns: "1fr 320px",
                gap: "0", alignItems: "start",
            }} className="profile-body">

                {/* MAIN COLUMN */}
                <div style={{ borderRight: "1.5px solid #f5f2eb" }}>

                    {/* ANALYTICS */}
                    <div style={{ padding: "48px 32px", borderBottom: "1.5px solid #f5f2eb" }}>
                        <div style={{
                            fontFamily: "var(--font-mono)", fontSize: "11px",
                            letterSpacing: "0.14em", textTransform: "uppercase",
                            opacity: 0.4, marginBottom: "32px",
                        }}>
                            Analytics
                        </div>

                        {!hasEnoughReviews ? (
                            <div style={{
                                padding: "48px 32px",
                                border: "1.5px dashed #c8c2b4",
                                textAlign: "center",
                            }}>
                                <div style={{
                                    fontFamily: "var(--font-sans)", fontSize: "20px",
                                    fontWeight: 700, marginBottom: "8px",
                                }}>
                                    Not enough reviews yet
                                </div>
                                <div style={{
                                    fontFamily: "var(--font-mono)", fontSize: "13px",
                                    opacity: 0.5, lineHeight: 1.6,
                                }}>
                                    Analytics show after {MIN_REVIEWS} reviews.<br />
                                    {reviewCount > 0
                                        ? `${MIN_REVIEWS - reviewCount} more needed.`
                                        : "Be the first to review."}
                                </div>
                            </div>
                        ) : (
                            <AnalyticsBlock analytics={analytics} />
                        )}
                    </div>

                    {/* TEXT REVIEWS */}
                    <div style={{ padding: "48px 32px" }}>
                        <div style={{
                            fontFamily: "var(--font-mono)", fontSize: "11px",
                            letterSpacing: "0.14em", textTransform: "uppercase",
                            opacity: 0.4, marginBottom: "32px",
                        }}>
                            Student comments
                            {textReviews.length > 0 && (
                                <span style={{ marginLeft: "8px", color: "#f5f2eb", opacity: 1 }}>
                                    ({textReviews.length})
                                </span>
                            )}
                        </div>

                        {textReviews.length === 0 ? (
                            <div style={{
                                fontFamily: "var(--font-mono)", fontSize: "13px",
                                opacity: 0.4, lineHeight: 1.6,
                            }}>
                                No written comments yet for this period.
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
                                {textReviews.map((review: any, i: number) => {
                                    const textAnswer = review.answers?.find(
                                        (a: any) => a.question?.type === "text" && a.answer_value?.trim()
                                    );
                                    if (!textAnswer) return null;
                                    return (
                                        <div key={review.id} style={{
                                            padding: "28px 0",
                                            borderBottom: i < textReviews.length - 1
                                                ? "1px solid #2a2725" : "none",
                                        }}>
                                            <div style={{
                                                display: "flex", alignItems: "center",
                                                gap: "12px", marginBottom: "12px",
                                            }}>
                                                <div style={{
                                                    width: "28px", height: "28px",
                                                    background: "#f5f2eb", borderRadius: "50%",
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
                            </div>
                        )}
                    </div>
                </div>

                {/* SIDEBAR */}
                <div style={{ padding: "48px 28px", position: "sticky", top: "57px" }}>
                    <div style={{
                        fontFamily: "var(--font-mono)", fontSize: "11px",
                        letterSpacing: "0.14em", textTransform: "uppercase",
                        opacity: 0.4, marginBottom: "24px",
                    }}>
                        Course history
                    </div>

                    {sections.length === 0 ? (
                        <div style={{
                            fontFamily: "var(--font-mono)", fontSize: "12px", opacity: 0.4,
                        }}>
                            No sections found.
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
                            {sections.map((s: any, i: number) => (
                                <div key={s.id} style={{
                                    padding: "16px 0",
                                    borderBottom: i < sections.length - 1
                                        ? "1px solid #2a2725" : "none",
                                }}>
                                    <div style={{
                                        display: "flex", justifyContent: "space-between",
                                        alignItems: "flex-start", gap: "8px",
                                    }}>
                                        <div>
                                            <div style={{
                                                fontFamily: "var(--font-mono)", fontSize: "12px",
                                                fontWeight: 500, letterSpacing: "0.04em", marginBottom: "2px",
                                            }}>
                                                {s.course?.code}
                                            </div>
                                            <div style={{
                                                fontFamily: "var(--font-mono)", fontSize: "11px",
                                                opacity: 0.5, lineHeight: 1.4,
                                            }}>
                                                {s.course?.title}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                                            <div style={{
                                                fontFamily: "var(--font-mono)", fontSize: "11px",
                                                opacity: 0.4,
                                            }}>
                                                {s.semester?.label}
                                            </div>
                                            {s.semester?.is_active && (
                                                <div style={{
                                                    fontFamily: "var(--font-mono)", fontSize: "10px",
                                                    color: "#1a4fd4", marginTop: "2px",
                                                }}>
                                                    Current
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {s.time_slot && (
                                        <div style={{
                                            fontFamily: "var(--font-mono)", fontSize: "11px",
                                            opacity: 0.35, marginTop: "4px",
                                        }}>
                                            {s.day_pattern} · {s.time_slot}
                                            {s.room && ` · ${s.room}`}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <style>{`
        .profile-header { grid-template-columns: 1fr auto; }
        .profile-body { grid-template-columns: 1fr 320px; }
        @media (max-width: 768px) {
          .profile-header { grid-template-columns: 1fr !important; }
          .profile-body { grid-template-columns: 1fr !important; }
          .profile-body > div:last-child { border-right: none !important; border-top: 1.5px solid #f5f2eb; }
        }
      `}</style>
        </div>
    );
}

function ctaButtonStyle(bg: string, color: string): React.CSSProperties {
    return {
        fontFamily: "var(--font-mono)", fontSize: "12px", fontWeight: 500,
        letterSpacing: "0.06em", textTransform: "uppercase",
        color, background: bg, padding: "12px 20px",
        border: `1.5px solid ${bg}`, textDecoration: "none",
        display: "inline-block", whiteSpace: "nowrap",
    };
}

const tabStyle: React.CSSProperties = {
    fontFamily: "var(--font-mono)", fontSize: "11px",
    letterSpacing: "0.08em", textTransform: "uppercase",
    padding: "14px 20px", textDecoration: "none",
    borderRight: "1px solid #2a2725", whiteSpace: "nowrap",
    display: "flex", alignItems: "center",
    transition: "background 0.12s",
};