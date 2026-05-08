"use client";
import { useEffect } from "react";

export default function PrintTrigger() {
  useEffect(() => {
    const t = setTimeout(() => window.print(), 500);
    return () => clearTimeout(t);
  }, []);

  return (
    <button
      onClick={() => window.print()}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        background: "#0f172a",
        color: "#fff",
        border: "none",
        cursor: "pointer",
        fontSize: "14px",
        fontWeight: 600,
        padding: "10px 22px",
        borderRadius: "10px",
        letterSpacing: "0.02em",
      }}
    >
      🖨️ &nbsp;Print / Save as PDF
    </button>
  );
}
