"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSearch(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!query.trim()) {
      router.push("/schedule");
    } else {
      router.push(`/schedule?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <form 
      onSubmit={handleSearch}
      style={{
        display: "flex", alignItems: "stretch",
        border: "1.5px solid #f5f2eb", marginBottom: "48px",
      }}
    >
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Faculty name, initial or course…"
        style={{
          flex: 1, fontFamily: "var(--font-mono)", fontSize: "13px",
          padding: "13px 16px", border: "none", background: "transparent",
          color: "#f5f2eb", outline: "none",
        }}
      />
      <button 
        type="submit"
        style={{
          fontFamily: "var(--font-mono)", fontSize: "11px",
          letterSpacing: "0.1em", textTransform: "uppercase",
          padding: "13px 18px", background: "#f5f2eb",
          color: "#0f0f0f", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center",
        }}
      >
        Search
      </button>
    </form>
  );
}
