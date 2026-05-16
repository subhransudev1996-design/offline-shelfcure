import { createServiceClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Store, Calendar, Key, MessageSquare } from "lucide-react";
import LicenseDetailClient from "./LicenseDetailClient";
import MobileAddonCard from "./MobileAddonCard";
import StoreInfoCard from "./StoreInfoCard";

export const dynamic = "force-dynamic";

const TYPE_STYLES = {
  trial:    { label: "Trial (7 days)", cls: "bg-orange-100 text-orange-600" },
  yearly:   { label: "1 Year",         cls: "bg-blue-100 text-blue-600"     },
  lifetime: { label: "Lifetime",       cls: "bg-emerald-100 text-emerald-700" },
};

export interface PaymentInstallment {
  id: string;
  installment_number: number;
  amount: number;
  due_date: string;
  paid_date: string | null;
  payment_method: string | null;
  reference_id: string | null;
  notes: string | null;
}

export interface PaymentPlan {
  id: string;
  payment_type: "one_time" | "3_month_emi" | "6_month_emi";
  payment_source: "razorpay_online" | "manual_offline";
  base_amount: number | null;
  gst_rate: number | null;
  total_amount: number;
  notes: string | null;
  created_at: string;
  cycle_start_date?: string | null;
  cycle_end_date?: string | null;
  installments: PaymentInstallment[];
}

export default async function LicenseDetailPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const licenseKey = decodeURIComponent(key);

  const supabase = await createServiceClient();

  const PAYMENT_COLS = "id, payment_type, payment_source, base_amount, gst_rate, total_amount, notes, created_at, product, cycle_start_date, cycle_end_date, license_payment_installments(id, installment_number, amount, due_date, paid_date, payment_method, reference_id, notes)";

  const [{ data: lic }, { data: desktopPayments }, { data: mobilePayments }, { data: pricing }] = await Promise.all([
    supabase.from("desktop_licenses").select("*").eq("license_key", licenseKey).single(),
    supabase.from("license_payments").select(PAYMENT_COLS)
      .eq("license_key", licenseKey).eq("product", "desktop")
      .order("created_at", { ascending: false }).limit(1),
    supabase.from("license_payments").select(PAYMENT_COLS)
      .eq("license_key", licenseKey).eq("product", "mobile")
      .order("created_at", { ascending: false }),
    supabase.from("pricing_settings").select("*").eq("id", 1).maybeSingle(),
  ]);

  // Back-calculate base amount if the global setting is GST-inclusive
  function resolveBase(amount: number, rate: number, inclusive: boolean) {
    if (!amount || amount <= 0) return 0;
    return inclusive ? amount / (1 + rate / 100) : amount;
  }

  const desktopDefaults = {
    baseAmount: resolveBase(
      Number(pricing?.desktop_base_amount ?? 0),
      Number(pricing?.desktop_gst_rate ?? 18),
      !!pricing?.desktop_gst_inclusive,
    ),
    gstRate: Number(pricing?.desktop_gst_rate ?? 18),
    paymentType: (pricing?.desktop_default_payment_type ?? "one_time") as "one_time" | "3_month_emi" | "6_month_emi",
  };
  const mobileDefaults = {
    baseAmount: resolveBase(
      Number(pricing?.mobile_base_amount ?? 0),
      Number(pricing?.mobile_gst_rate ?? 18),
      !!pricing?.mobile_gst_inclusive,
    ),
    gstRate: Number(pricing?.mobile_gst_rate ?? 18),
  };

  if (!lic) notFound();

  const now = new Date();
  const isExpired = lic.expiry_date && new Date(lic.expiry_date) < now;
  const daysLeft = lic.expiry_date
    ? Math.ceil((new Date(lic.expiry_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const typeStyle = TYPE_STYLES[lic.license_type as keyof typeof TYPE_STYLES] ?? TYPE_STYLES.trial;
  const activatedMachines: { machine_id: string; activated_at: string }[] =
    Array.isArray(lic.activated_machines) ? lic.activated_machines : [];

  function toPaymentPlan(raw: typeof desktopPayments extends (infer T)[] | null ? T : never): PaymentPlan {
    return {
      id:               (raw as any).id,
      payment_type:     (raw as any).payment_type,
      payment_source:   (raw as any).payment_source ?? "manual_offline",
      base_amount:      (raw as any).base_amount ?? null,
      gst_rate:         (raw as any).gst_rate    ?? null,
      total_amount:     (raw as any).total_amount,
      notes:            (raw as any).notes,
      created_at:       (raw as any).created_at,
      cycle_start_date: (raw as any).cycle_start_date ?? null,
      cycle_end_date:   (raw as any).cycle_end_date   ?? null,
      installments:     ((raw as any).license_payment_installments as PaymentInstallment[] ?? [])
        .sort((a, b) => a.installment_number - b.installment_number),
    };
  }

  const paymentPlan: PaymentPlan | null = desktopPayments?.[0] ? toPaymentPlan(desktopPayments[0]) : null;
  const mobilePaymentPlans: PaymentPlan[] = (mobilePayments ?? []).map(toPaymentPlan);

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        href="/admin/licenses"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-brand-navy transition-colors"
      >
        <ArrowLeft size={15} /> Back to Licenses
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-navy/10 flex items-center justify-center shrink-0">
            <Store size={24} className="text-brand-navy" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{lic.pharmacy_name || "Unknown Pharmacy"}</h1>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${typeStyle.cls}`}>
                {typeStyle.label}
              </span>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${lic.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
                {lic.status === "active" ? "Active" : "Suspended"}
              </span>
              {isExpired && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-500">
                  Expired
                </span>
              )}
            </div>
          </div>
        </div>
        <Link
          href={`/admin/licenses/${encodeURIComponent(licenseKey)}/comms`}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-50 border border-violet-200 text-violet-700 text-sm font-semibold hover:bg-violet-100 transition-colors"
        >
          <MessageSquare size={15} />
          Messages
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[5fr_7fr] gap-5 items-start">
        {/* Left column — info cards */}
        <div className="space-y-4">

          {/* Validity */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Calendar size={16} className="text-slate-400" />
              <h3 className="text-sm font-bold text-slate-900">Validity</h3>
            </div>
            <div className="space-y-3">
              <Row label="License Type" value={typeStyle.label} />
              <Row label="Expiry Date" value={lic.expiry_date ? formatDate(lic.expiry_date) : "Never (Lifetime)"} />
              {daysLeft !== null && (
                <Row
                  label="Days Remaining"
                  value={
                    daysLeft > 0
                      ? `${daysLeft} days`
                      : `Expired ${Math.abs(daysLeft)} days ago`
                  }
                  valueClass={daysLeft > 0 ? "text-brand-emerald font-semibold" : "text-red-500 font-semibold"}
                />
              )}
              {lic.updated_at && <Row label="Last Updated" value={formatDate(lic.updated_at)} />}
            </div>
          </div>

          {/* License info */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Key size={16} className="text-slate-400" />
              <h3 className="text-sm font-bold text-slate-900">License Info</h3>
            </div>
            <div className="space-y-3">
              <Row label="Plan" value={lic.plan ?? "Standard"} />
              <Row label="Max Machines" value={String(lic.max_machines ?? 1)} />
            </div>
          </div>

          {/* Store info — editable */}
          <StoreInfoCard
            licenseKey={lic.license_key}
            pharmacyName={lic.pharmacy_name ?? ""}
            ownerName={(lic as any).owner_name ?? ""}
            address={lic.address ?? ""}
            gstNumber={(lic as any).gst_number ?? ""}
            drugLicense={(lic as any).drug_license ?? ""}
          />

          {/* Activated machines — rendered in client component so machines can be removed */}
        </div>

        {/* Right column — actions + payment */}
        <div>
          <LicenseDetailClient
            licenseKey={lic.license_key}
            licenseType={lic.license_type ?? "trial"}
            isActive={lic.status === "active"}
            ownerEmail={lic.owner_email ?? ""}
            contactEmail={lic.contact_email ?? ""}
            contactPhone={lic.contact_phone ?? ""}
            maxMachines={lic.max_machines ?? 1}
            aiCredits={lic.ai_credits ?? 0}
            aiCreditsTotal={lic.ai_credits_total ?? lic.ai_credits ?? 0}
            labelScansUsed={(lic as any).label_scans_used ?? 0}
            activatedMachines={activatedMachines}
            paymentPlan={paymentPlan}
            defaults={desktopDefaults}
            isTest={(lic as any).is_test ?? false}
          />
          <MobileAddonCard
            licenseKey={lic.license_key}
            mobileAddon={(lic as any).mobile_addon ?? false}
            mobileAddonType={(lic as any).mobile_addon_type ?? null}
            mobileAddonExpiry={(lic as any).mobile_addon_expiry ?? null}
            mobilePaymentPlans={mobilePaymentPlans}
            defaults={mobileDefaults}
          />
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-400">{label}</span>
      <span className={valueClass ?? "text-slate-800 font-medium"}>{value}</span>
    </div>
  );
}
