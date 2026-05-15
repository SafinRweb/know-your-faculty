"use client";

import { FacultyAnalytics } from "@/types";
import {
  PieChart, Pie, Cell, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";

interface Props {
  analytics: FacultyAnalytics[];
}

const COLORS: Record<string, string> = {
  "Yes":           "#34d399",
  "No":            "#f87171",
  "Drop":          "#ef4444",
};

const FALLBACK_COLORS = [
  "#e8622c", "#60a5fa", "#a78bfa",
  "#fbbf24", "#34d399", "#f87171",
];

function getColor(value: string, index: number) {
  return COLORS[value] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

// Check if a question is the "recommend" question
function isRecommendQuestion(text: string) {
  const lower = text.toLowerCase();
  return lower.includes("recommend") || lower.includes("drop");
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div style={{
      background: "#1a1917", padding: "10px 14px",
      fontFamily: "var(--font-mono)", fontSize: "12px",
      color: "#f5f2eb", border: "1.5px solid #2a2725",
    }}>
      <div style={{ fontWeight: 500, marginBottom: "2px" }}>{d.name}</div>
      <div style={{ opacity: 0.6 }}>
        {d.value}% · {d.payload.vote_count} vote{d.payload.vote_count !== 1 ? "s" : ""}
      </div>
    </div>
  );
};

const CustomLegend = ({ payload }: any) => (
  <div style={{
    display: "flex", flexWrap: "wrap",
    gap: "10px", marginTop: "8px",
    justifyContent: "center",
  }}>
    {payload?.map((entry: any, i: number) => (
      <div key={i} style={{
        display: "flex", alignItems: "center", gap: "6px",
        fontFamily: "var(--font-mono)", fontSize: "11px",
        letterSpacing: "0.04em",
      }}>
        <span style={{
          width: "8px", height: "8px",
          background: entry.color, display: "inline-block",
          flexShrink: 0,
        }} />
        {entry.value}
      </div>
    ))}
  </div>
);

export default function AnalyticsBlock({ analytics }: Props) {
  if (!analytics.length) {
    return (
      <div style={{
        fontFamily: "var(--font-mono)", fontSize: "13px", opacity: 0.4,
      }}>
        No analytics data for this period.
      </div>
    );
  }

  // Group by question
  const grouped = analytics.reduce((acc, row) => {
    const key = row.question_id;
    if (!acc[key]) {
      acc[key] = {
        question: (row as any).question_text || "Question",
        rows: [],
      };
    }
    acc[key].rows.push(row);
    return acc;
  }, {} as Record<string, { question: string; rows: FacultyAnalytics[] }>);

  const groups = Object.values(grouped);

  // Separate recommendation from other questions
  const recommendGroup = groups.find((g) => isRecommendQuestion(g.question));
  const otherGroups = groups.filter((g) => !isRecommendQuestion(g.question));

  return (
    <div>
      {/* ── RECOMMENDATION HIGHLIGHT ── */}
      {recommendGroup && (
        <RecommendationCard group={recommendGroup} />
      )}

      {/* ── OTHER QUESTIONS GRID ── */}
      {otherGroups.length > 0 && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "0",
          border: "1.5px solid #2a2725",
          marginTop: recommendGroup ? "24px" : "0",
        }}>
          {otherGroups.map((group, gi) => (
            <QuestionCard key={gi} group={group} index={gi} totalCount={otherGroups.length} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Recommendation highlight card ── */
function RecommendationCard({ group }: { group: { question: string; rows: FacultyAnalytics[] } }) {
  const pieData = group.rows.map((r) => ({
    name: r.answer_value,
    value: Number(r.percentage),
    vote_count: r.vote_count,
  }));

  const yesRow = group.rows.find((r) => r.answer_value === "Yes");
  const dropRow = group.rows.find((r) => r.answer_value === "Drop");
  const totalVotes = group.rows.reduce((sum, r) => sum + r.vote_count, 0);
  const yesPercent = yesRow ? Number(yesRow.percentage) : 0;
  const isRecommended = yesPercent >= 50;

  return (
    <div style={{
      border: `2px solid ${isRecommended ? "#34d399" : "#ef4444"}`,
      background: isRecommended
        ? "rgba(52,211,153,0.04)"
        : "rgba(239,68,68,0.04)",
      padding: "0",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Top badge */}
      <div style={{
        background: isRecommended ? "#34d399" : "#ef4444",
        padding: "10px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{
          fontFamily: "var(--font-mono)", fontSize: "11px",
          letterSpacing: "0.12em", textTransform: "uppercase",
          fontWeight: 600, color: "#0f0f0f",
        }}>
          {isRecommended ? "✓ Recommended" : "⚠ Not Recommended"}
        </div>
        <div style={{
          fontFamily: "var(--font-mono)", fontSize: "11px",
          letterSpacing: "0.06em", color: "#0f0f0f",
          opacity: 0.6,
        }}>
          {totalVotes} response{totalVotes !== 1 ? "s" : ""}
        </div>
      </div>

      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr",
        gap: "0",
      }} className="rec-card-grid">
        {/* Left — big number */}
        <div style={{
          padding: "32px 28px",
          display: "flex", flexDirection: "column",
          justifyContent: "center", alignItems: "center",
          borderRight: "1px solid rgba(255,255,255,0.06)",
        }}>
          <div style={{
            fontFamily: "var(--font-sans)",
            fontSize: "64px", fontWeight: 800,
            letterSpacing: "-0.04em", lineHeight: 1,
            color: isRecommended ? "#34d399" : "#ef4444",
          }}>
            {yesPercent}%
          </div>
          <div style={{
            fontFamily: "var(--font-mono)", fontSize: "11px",
            letterSpacing: "0.08em", textTransform: "uppercase",
            opacity: 0.5, marginTop: "8px",
          }}>
            say Yes
          </div>

          {/* Stacked bar */}
          <div style={{
            width: "100%", maxWidth: "200px",
            marginTop: "20px",
          }}>
            <div style={{
              display: "flex", height: "8px",
              borderRadius: "4px", overflow: "hidden",
            }}>
              {pieData
                .sort((a, b) => (a.name === "Yes" ? -1 : 1))
                .map((d, i) => (
                  <div key={i} style={{
                    width: `${d.value}%`,
                    background: getColor(d.name ?? "", i),
                    transition: "width 0.6s ease",
                  }} />
                ))}
            </div>
            <div style={{
              display: "flex", justifyContent: "space-between",
              marginTop: "6px",
            }}>
              {pieData.map((d, i) => (
                <span key={i} style={{
                  fontFamily: "var(--font-mono)", fontSize: "10px",
                  opacity: 0.5, display: "flex", alignItems: "center", gap: "4px",
                }}>
                  <span style={{
                    width: "6px", height: "6px", borderRadius: "1px",
                    background: getColor(d.name ?? "", i),
                    display: "inline-block",
                  }} />
                  {d.name}: {d.vote_count}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right — pie chart */}
        <div style={{ padding: "24px 20px" }}>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {pieData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={getColor(entry.name ?? "", i)}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <style>{`
        @media (max-width: 600px) {
          .rec-card-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

/* ── Standard question card ── */
function QuestionCard({ group, index, totalCount }: {
  group: { question: string; rows: FacultyAnalytics[] };
  index: number;
  totalCount: number;
}) {
  const pieData = group.rows.map((r) => ({
    name: r.answer_value,
    value: Number(r.percentage),
    vote_count: r.vote_count,
  }));

  const topAnswer = [...group.rows].sort(
    (a, b) => b.vote_count - a.vote_count
  )[0];

  return (
    <div style={{
      padding: "32px 28px",
      borderRight: index < totalCount - 1
        ? "1.5px solid #2a2725" : "none",
    }}>
      {/* Question */}
      <div style={{
        fontFamily: "var(--font-mono)", fontSize: "11px",
        letterSpacing: "0.08em", textTransform: "uppercase",
        opacity: 0.4, marginBottom: "6px",
      }}>
        {`0${index + 1}`}
      </div>
      <div style={{
        fontFamily: "var(--font-sans)", fontSize: "15px",
        fontWeight: 700, letterSpacing: "-0.01em",
        lineHeight: 1.2, marginBottom: "24px",
      }}>
        {group.question}
      </div>

      {/* Pie chart */}
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={75}
            paddingAngle={2}
            dataKey="value"
            strokeWidth={0}
          >
            {pieData.map((entry, i) => (
              <Cell
                key={i}
                fill={getColor(entry.name ?? "", i)}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Top answer callout */}
      <div style={{
        marginTop: "20px", padding: "12px 14px",
        background: "#2a2725",
        display: "flex", justifyContent: "space-between",
        alignItems: "center",
      }}>
        <span style={{
          fontFamily: "var(--font-mono)", fontSize: "11px",
          opacity: 0.5, letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}>
          Most common
        </span>
        <span style={{
          fontFamily: "var(--font-mono)", fontSize: "13px",
          fontWeight: 500,
          color: getColor(topAnswer?.answer_value ?? "", 0),
        }}>
          {topAnswer?.answer_value}
        </span>
      </div>

      {/* Bar breakdown */}
      <div style={{
        marginTop: "16px",
        display: "flex", flexDirection: "column", gap: "8px",
      }}>
        {[...group.rows]
          .sort((a, b) => b.vote_count - a.vote_count)
          .map((row, i) => (
            <div key={i}>
              <div style={{
                display: "flex", justifyContent: "space-between",
                marginBottom: "3px",
              }}>
                <span style={{
                  fontFamily: "var(--font-mono)", fontSize: "11px",
                  letterSpacing: "0.04em",
                }}>
                  {row.answer_value}
                </span>
                <span style={{
                  fontFamily: "var(--font-mono)", fontSize: "11px",
                  opacity: 0.4,
                }}>
                  {row.percentage}%
                </span>
              </div>
              <div style={{
                height: "4px", background: "#2a2725",
                position: "relative",
              }}>
                <div style={{
                  position: "absolute", top: 0, left: 0, bottom: 0,
                  width: `${row.percentage}%`,
                  background: getColor(row.answer_value ?? "", i),
                  transition: "width 0.6s ease",
                }} />
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}