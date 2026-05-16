import { createServiceClient } from "@/lib/supabase/server";
import PricingSettingsForm from "./PricingSettingsForm";

export const dynamic = "force-dynamic";

const DEFAULTS = {
  desktop_base_amount: 0,
  desktop_gst_rate: 18,
  desktop_gst_inclusive: false,
  desktop_default_payment_type: "one_time" as const,
  mobile_base_amount: 0,
  mobile_gst_rate: 18,
  mobile_gst_inclusive: false,
  ai_credits_included: 50,
  label_scans_included: 50,
};

export default async function PricingSettingsPage() {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("pricing_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  const settings = data ?? DEFAULTS;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Pricing Settings</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Set global default prices for desktop and mobile licenses so you don&apos;t need to enter them every time. These pre-fill the new-payment form on each license — you can still override per customer.
        </p>
      </div>

      <PricingSettingsForm
        initial={{
          desktop_base_amount: Number(settings.desktop_base_amount ?? 0),
          desktop_gst_rate: Number(settings.desktop_gst_rate ?? 18),
          desktop_gst_inclusive: !!settings.desktop_gst_inclusive,
          desktop_default_payment_type: settings.desktop_default_payment_type ?? "one_time",
          mobile_base_amount: Number(settings.mobile_base_amount ?? 0),
          mobile_gst_rate: Number(settings.mobile_gst_rate ?? 18),
          mobile_gst_inclusive: !!settings.mobile_gst_inclusive,
          ai_credits_included: Number(settings.ai_credits_included ?? 50),
          label_scans_included: Number(settings.label_scans_included ?? 50),
        }}
      />
    </div>
  );
}
