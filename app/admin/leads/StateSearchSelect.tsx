"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

const STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab",
  "Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh",
  "Uttarakhand","West Bengal","Delhi","Jammu & Kashmir","Ladakh",
];

interface Props {
  value: string;
  onChange: (val: string) => void;
}

export default function StateSearchSelect({ value, onChange }: Props) {
  const [open, setOpen]   = useState(false);
  const [query, setQuery] = useState("");
  const containerRef      = useRef<HTMLDivElement>(null);

  const filtered = query.trim()
    ? STATES.filter((s) => s.toLowerCase().includes(query.toLowerCase()))
    : STATES;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function select(state: string) {
    onChange(state);
    setOpen(false);
    setQuery("");
  }

  function clear() {
    onChange("");
    setOpen(false);
    setQuery("");
  }

  return (
    <div ref={containerRef} className="relative">
      <div
        className="w-full flex items-center text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white cursor-pointer focus-within:ring-2 focus-within:ring-brand-cyan/30 focus-within:border-brand-cyan"
        onClick={() => { setOpen(true); setQuery(""); }}
      >
        {open ? (
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search state..."
            className="flex-1 outline-none bg-transparent text-slate-800 placeholder-slate-400"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className={`flex-1 truncate ${value ? "text-slate-800" : "text-slate-400"}`}>
            {value || "Select state"}
          </span>
        )}
        <ChevronDown size={14} className={`text-slate-400 ml-1 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
          {value && (
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); clear(); }}
              className="w-full text-left px-3 py-2 text-xs text-slate-400 hover:bg-slate-50 border-b border-slate-100"
            >
              Clear selection
            </button>
          )}
          {filtered.length === 0 ? (
            <p className="px-3 py-2 text-xs text-slate-400">No states found</p>
          ) : (
            filtered.map((s) => (
              <button
                key={s}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); select(s); }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors ${s === value ? "text-brand-cyan font-semibold bg-brand-cyan/5" : "text-slate-700"}`}
              >
                {s}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
