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
  "Yes":           "#1a7a3a",
  "No":            "#d4401a",
};

const FALLBACK_COLORS = [
  "#f5f2eb", "#d4401a", "#1a4fd4",
  "#4a7fd4", "#c8c2b4", "#2a7a4f",
];

function getColor(value: string, index: number) {
  return COLORS[value] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div style={{
      background: "#f5f2eb", padding: "10px 14px",
      fontFamily: "var(--font-mono)", fontSize: "12px",
      color: "#0f0f0f", border: "none",
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

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
      gap: "0",
      border: "1.5px solid #f5f2eb",
    }}>
      {groups.map((group, gi) => {
        const pieData = group.rows.map((r) => ({
          name: r.answer_value,
          value: Number(r.percentage),
          vote_count: r.vote_count,
        }));

        const topAnswer = [...group.rows].sort(
          (a, b) => b.vote_count - a.vote_count
        )[0];

        return (
          <div key={gi} style={{
            padding: "32px 28px",
            borderRight: gi < groups.length - 1
              ? "1.5px solid #f5f2eb" : "none",
          }}>
            {/* Question */}
            <div style={{
              fontFamily: "var(--font-mono)", fontSize: "11px",
              letterSpacing: "0.08em", textTransform: "uppercase",
              opacity: 0.4, marginBottom: "6px",
            }}>
              {`0${gi + 1}`}
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
      })}
    </div>
  );
}