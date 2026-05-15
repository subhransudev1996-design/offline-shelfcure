import type { SupabaseClient } from "@supabase/supabase-js";

// Central activity-log writer. Every meaningful change to a lead — follow-up,
// demo, visit, trial, voice note, status change — funnels through here so
// the timeline screen has one source of truth.
//
// Failures are deliberately swallowed: a failed timeline insert must never
// take down the user-facing action that triggered it.

export type LeadEventType =
  | "followup"
  | "demo_scheduled"
  | "demo_completed"
  | "visit_check_in"
  | "visit_check_out"
  | "trial_started"
  | "trial_used"
  | "trial_updated"
  | "voice_note"
  | "status_changed"
  | "assigned"
  | "converted";

export async function recordEvent(
  supabase: SupabaseClient,
  args: {
    leadId: string;
    actorId: string | null;
    eventType: LeadEventType;
    payload?: Record<string, unknown>;
  }
): Promise<void> {
  try {
    await supabase.from("lead_timeline").insert({
      lead_id:    args.leadId,
      actor_id:   args.actorId,
      event_type: args.eventType,
      payload:    args.payload ?? {},
    });
  } catch {
    /* best-effort */
  }
}

/// Create a single in-app notification. Best-effort.
export async function pushNotification(
  supabase: SupabaseClient,
  args: {
    userId: string;
    kind: string;
    title: string;
    body?: string;
    leadId?: string;
  }
): Promise<void> {
  try {
    await supabase.from("notifications").insert({
      user_id: args.userId,
      kind:    args.kind,
      title:   args.title,
      body:    args.body ?? null,
      lead_id: args.leadId ?? null,
    });
  } catch {
    /* best-effort */
  }
}
