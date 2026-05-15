"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export interface MapLead {
  id: string;
  name: string;
  status: string;
  city: string | null;
  lat: number;
  lng: number;
  assigned_to: string | null;
  assignee: string | null;
}
export interface MapVisit {
  id: string;
  lead_id: string;
  lat: number;
  lng: number;
  at: string;
  employee: string | null;
}

// Status → marker fill colour (mirrors mobile + PRD §8).
const STATUS_COLOR: Record<string, string> = {
  new:                "#94a3b8",
  contacted:          "#3b82f6",
  followup_pending:   "#0284c7",
  call_not_picked:    "#a1a1aa",
  interested:         "#f59e0b",
  visit_planned:      "#0d9488",
  demo_scheduled:     "#6366f1",
  demo_done:          "#9333ea",
  trial_activated:    "#06b6d4",
  negotiating:        "#f97316",
  payment_pending:    "#ca8a04",
  future_opportunity: "#a8a29e",
  converted:          "#10b981",
  lost:               "#ef4444",
};

const STATUS_LABEL: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  followup_pending: "Follow-up",
  call_not_picked: "No Answer",
  interested: "Interested",
  visit_planned: "Visit Planned",
  demo_scheduled: "Demo Scheduled",
  demo_done: "Demo Done",
  trial_activated: "Trial",
  negotiating: "Negotiating",
  payment_pending: "Payment",
  future_opportunity: "Future",
  converted: "Converted",
  lost: "Lost",
};

// Single global loader so multiple instances on the same page don't load twice.
let mapsLoader: Promise<void> | null = null;
function loadMaps(apiKey: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((window as any).google?.maps?.Map) return Promise.resolve();
  if (mapsLoader) return mapsLoader;
  mapsLoader = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=visualization&v=weekly`;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(s);
  });
  return mapsLoader;
}

export default function MapClient({
  apiKey, leads, visits,
}: {
  apiKey: string;
  leads: MapLead[];
  visits: MapVisit[];
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leadMarkersRef = useRef<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const visitMarkersRef = useRef<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const heatmapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const infoRef = useRef<any>(null);

  const [showVisits, setShowVisits]   = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [error, setError]             = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    loadMaps(apiKey)
      .then(() => {
        if (cancelled || !containerRef.current) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const g = (window as any).google.maps;

        // Centre on the centroid of pinned leads, or India by default.
        const points = leads.map((l) => ({ lat: l.lat, lng: l.lng }));
        const initial = points.length
          ? points.reduce(
              (acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }),
              { lat: 0, lng: 0 },
            )
          : { lat: 0, lng: 0 };
        const center = points.length
          ? { lat: initial.lat / points.length, lng: initial.lng / points.length }
          : { lat: 20.5937, lng: 78.9629 };

        mapRef.current = new g.Map(containerRef.current, {
          center,
          zoom: points.length > 1 ? 10 : 5,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });
        infoRef.current = new g.InfoWindow();

        // Lead markers
        leadMarkersRef.current = leads.map((l) => {
          const colour = STATUS_COLOR[l.status] ?? "#64748b";
          const marker = new g.Marker({
            position: { lat: l.lat, lng: l.lng },
            map: mapRef.current,
            title: l.name,
            icon: {
              path: g.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: colour,
              fillOpacity: 0.95,
              strokeColor: "#fff",
              strokeWeight: 2,
            },
          });
          marker.addListener("click", () => {
            infoRef.current.setContent(`
              <div style="font-family:system-ui;font-size:13px;min-width:180px">
                <div style="font-weight:700;margin-bottom:2px">${escapeHtml(l.name)}</div>
                <div style="color:#64748b;font-size:11px;margin-bottom:6px">
                  ${escapeHtml(STATUS_LABEL[l.status] ?? l.status)}
                  ${l.city ? ` · ${escapeHtml(l.city)}` : ""}
                </div>
                ${l.assignee ? `<div style="font-size:11px;color:#475569">Assigned to ${escapeHtml(l.assignee)}</div>` : ""}
                <a href="/admin/leads/${l.id}" style="display:inline-block;margin-top:6px;color:#0B1F3A;font-weight:600;font-size:12px">Open lead →</a>
              </div>
            `);
            infoRef.current.open(mapRef.current, marker);
          });
          return marker;
        });

        // Fit camera to all pins
        if (points.length > 1) {
          const bounds = new g.LatLngBounds();
          points.forEach((p) => bounds.extend(p));
          mapRef.current.fitBounds(bounds, 60);
        }

        // Visit markers — small dim circles, on by default but toggleable.
        visitMarkersRef.current = visits.map((v) => {
          const marker = new g.Marker({
            position: { lat: v.lat, lng: v.lng },
            map: mapRef.current,
            icon: {
              path: g.SymbolPath.CIRCLE,
              scale: 3,
              fillColor: "#0B1F3A",
              fillOpacity: 0.55,
              strokeColor: "#fff",
              strokeWeight: 1,
            },
            title: v.employee ?? "Visit",
          });
          marker.addListener("click", () => {
            const when = new Date(v.at).toLocaleString("en-IN");
            infoRef.current.setContent(`
              <div style="font-family:system-ui;font-size:12px;min-width:150px">
                <div style="font-weight:700">Visit</div>
                ${v.employee ? `<div style="color:#475569">by ${escapeHtml(v.employee)}</div>` : ""}
                <div style="color:#94a3b8;margin-top:2px">${escapeHtml(when)}</div>
              </div>
            `);
            infoRef.current.open(mapRef.current, marker);
          });
          return marker;
        });

        // Heatmap from converted leads.
        const heatPoints = leads
          .filter((l) => l.status === "converted")
          .map((l) => new g.LatLng(l.lat, l.lng));
        if (heatPoints.length > 0) {
          heatmapRef.current = new g.visualization.HeatmapLayer({
            data: heatPoints,
            radius: 28,
            opacity: 0.7,
            map: mapRef.current,
          });
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load map"));

    return () => {
      cancelled = true;
      // Clear markers so they're not leaked between renders.
      leadMarkersRef.current.forEach((m) => m.setMap(null));
      visitMarkersRef.current.forEach((m) => m.setMap(null));
      if (heatmapRef.current) heatmapRef.current.setMap(null);
      leadMarkersRef.current = [];
      visitMarkersRef.current = [];
      heatmapRef.current = null;
    };
  }, [apiKey, leads, visits]);

  // Toggle visit markers without rebuilding the map.
  useEffect(() => {
    if (!mapRef.current) return;
    visitMarkersRef.current.forEach((m) => m.setMap(showVisits ? mapRef.current : null));
  }, [showVisits]);

  useEffect(() => {
    if (!heatmapRef.current) return;
    heatmapRef.current.setMap(showHeatmap ? mapRef.current : null);
  }, [showHeatmap]);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-sm text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Toggle bar + legend */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
          <input
            type="checkbox"
            checked={showVisits}
            onChange={(e) => setShowVisits(e.target.checked)}
          />
          Visit pins
        </label>
        <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
          <input
            type="checkbox"
            checked={showHeatmap}
            onChange={(e) => setShowHeatmap(e.target.checked)}
          />
          Conversion heatmap
        </label>
        <div className="ml-auto flex flex-wrap items-center gap-2.5">
          {(["converted", "interested", "demo_scheduled", "negotiating", "lost", "new"] as const).map((s) => (
            <span key={s} className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: STATUS_COLOR[s] }}
              />
              {STATUS_LABEL[s]}
            </span>
          ))}
        </div>
      </div>

      {/* The map */}
      <div
        ref={containerRef}
        className="w-full rounded-2xl border border-slate-200 overflow-hidden"
        style={{ height: "calc(100vh - 240px)", minHeight: 460 }}
      />

      <p className="text-xs text-slate-400 text-center">
        Pins are saved by mobile field staff (first check-in pins the pharmacy).
        Manage assignments at{" "}
        <Link href="/admin/leads" className="underline">/admin/leads</Link>.
      </p>
    </div>
  );
}

// Tiny HTML escape for info-window content.
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
