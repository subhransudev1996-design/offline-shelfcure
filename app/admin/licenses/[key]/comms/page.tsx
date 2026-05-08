import { createServiceClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MessageSquare } from "lucide-react";
import CommsClient from "./CommsClient";

export const dynamic = "force-dynamic";

export interface Communication {
  id:          string;
  channel:     "email" | "whatsapp";
  template_id: string | null;
  subject:     string | null;
  message:     string;
  image_url:   string | null;
  recipient:   string | null;
  status:      "sent" | "failed";
  sent_at:     string;
}

export default async function CommsPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  const licenseKey = decodeURIComponent(key);

  const supabase = await createServiceClient();

  const [{ data: lic }, { data: comms }] = await Promise.all([
    supabase
      .from("desktop_licenses")
      .select("license_key, pharmacy_name, owner_email, contact_email, contact_phone")
      .eq("license_key", licenseKey)
      .single(),
    supabase
      .from("license_communications")
      .select("id, channel, template_id, subject, message, image_url, recipient, status, sent_at")
      .eq("license_key", licenseKey)
      .order("sent_at", { ascending: false }),
  ]);

  if (!lic) notFound();

  return (
    <div className="space-y-6">
      <Link
        href={`/admin/licenses/${encodeURIComponent(licenseKey)}`}
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-brand-navy transition-colors"
      >
        <ArrowLeft size={15} /> Back to License
      </Link>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
          <MessageSquare size={18} className="text-violet-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Communications</h1>
          <p className="text-sm text-slate-400">{lic.pharmacy_name || "Unknown Pharmacy"}</p>
        </div>
      </div>

      <CommsClient
        licenseKey={licenseKey}
        ownerEmail={lic.owner_email ?? ""}
        contactEmail={lic.contact_email ?? ""}
        contactPhone={lic.contact_phone ?? ""}
        comms={(comms ?? []) as Communication[]}
      />
    </div>
  );
}
