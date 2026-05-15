import type { SupabaseClient } from "@supabase/supabase-js";

// Lead priority score (0..100), derived from current state. Higher = sooner.
// Used to surface "hot" leads on the mobile dashboard and admin reports.
// Re-computed on every write that affects the inputs (follow-up, demo, trial,
// status change). Kept deliberately simple — tune later from real-world data.

const STATUS_BASE: Record<string, number> = {
  new:                 10,
  contacted:           20,
  followup_pending:    30,
  call_not_picked:     15,
  interested:          50,
  visit_planned:       45,
  demo_scheduled:      55,
  demo_done:           60,
  trial_activated:     70,
  negotiating:         80,
  payment_pending:     90,
  future_opportunity:  20,
  converted:          100,
  lost:                 0,
};

interface ScoreInputs {
  status: string;
  followups: { next_followup_date: string | null }[];
  demos:     { status: string; scheduled_at: string }[];
  trial:     { expiry_date: string | null; last_active_date: string | null } | null;
}

export function computePriorityScore(i: ScoreInputs): number {
  let s = STATUS_BASE[i.status] ?? 25;

  // Follow-up timing: today bumps, overdue penalises.
  const today = new Date().toISOString().slice(0, 10);
  const pendingDates = i.followups
    .map((f) => f.next_followup_date)
    .filter((d): d is string => !!d)
    .sort();
  if (pendingDates.length) {
    const next = pendingDates[0];
    if (next < today) s -= 15;
    else if (next === today) s += 10;
    else s += 4;
  }

  // Upcoming demo bumps.
  const nowIso = new Date().toISOString();
  const upcomingDemo = i.demos.find(
    (d) => d.status === "scheduled" && d.scheduled_at >= nowIso
  );
  if (upcomingDemo) s += 8;

  // Active trial signals.
  if (i.trial) {
    if (i.trial.last_active_date) {
      const days =
        (Date.now() - new Date(i.trial.last_active_date).getTime()) /
        86_400_000;
      if (days < 3) s += 12;
      else if (days < 7) s += 5;
    }
    if (i.trial.expiry_date && i.trial.expiry_date < today) s -= 10;
  }

  return Math.max(0, Math.min(100, Math.round(s)));
}

/// Refresh `leads.priority_score` for one lead, after a follow-up/demo/trial
/// write. Safe to call without awaiting — failures are swallowed so the user-
/// facing request still succeeds.
export async function recomputePriority(
  supabase: SupabaseClient,
  leadId: string,
): Promise<void> {
  try {
    const { data: lead } = await supabase
      .from("leads")
      .select("status")
      .eq("id", leadId)
      .maybeSingle();
    if (!lead) return;

    const [{ data: followups }, { data: demos }, { data: trial }] =
      await Promise.all([
        supabase.from("lead_followups")
          .select("next_followup_date")
          .eq("lead_id", leadId),
        supabase.from("lead_demos")
          .select("status, scheduled_at")
          .eq("lead_id", leadId),
        supabase.from("lead_trials")
          .select("expiry_date, last_active_date")
          .eq("lead_id", leadId)
          .maybeSingle(),
      ]);

    const score = computePriorityScore({
      status: lead.status as string,
      followups: (followups ?? []) as { next_followup_date: string | null }[],
      demos: (demos ?? []) as { status: string; scheduled_at: string }[],
      trial: (trial ?? null) as { expiry_date: string | null; last_active_date: string | null } | null,
    });

    await supabase.from("leads").update({ priority_score: score }).eq("id", leadId);
  } catch {
    /* non-fatal — score will catch up on the next write */
  }
}
