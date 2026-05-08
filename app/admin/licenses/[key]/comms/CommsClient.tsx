"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Mail, MessageCircle, Send, ImageIcon, X,
  CheckCircle2, XCircle, AlertCircle,
} from "lucide-react";
import { TEMPLATE_DEFS, type TemplateId } from "@/lib/comms-templates";
import type { Communication } from "./page";

interface Props {
  licenseKey:    string;
  ownerEmail:    string;
  contactEmail:  string;
  contactPhone:  string;
  comms:         Communication[];
}

const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

function plainToHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");
}

function stripHtml(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .trim();
}

// ── Rich text toolbar ──────────────────────────────────────────────

const TOOLBAR_COLORS = [
  "#000000", "#ef4444", "#f97316", "#f59e0b",
  "#22c55e", "#06b6d4", "#3b82f6", "#7c3aed", "#ec4899",
];

const TOOLBAR_EMOJIS = [
  "😊","😄","🙏","👍","❤️","🎉","✨","🔥",
  "💊","🏥","📋","💰","📈","🛒","📞","💬",
  "🌐","✅","⭐","🎁","🎯","🚀","📢","💡",
  "⚡","🔔","📲","🏆","👋","🎊","💪","🤝",
];

function RichToolbar({ editorRef }: { editorRef: React.RefObject<HTMLDivElement | null> }) {
  const [showColor, setShowColor] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const colorRef = useRef<HTMLDivElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (colorRef.current && !colorRef.current.contains(e.target as Node)) setShowColor(false);
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) setShowEmoji(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  function exec(cmd: string, val?: string) {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val ?? "");
  }

  return (
    <div className="flex items-center gap-0.5 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-t-xl">
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); exec("bold"); }}
        title="Bold"
        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-200 text-slate-800 text-xs font-black transition-all select-none"
      >B</button>
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); exec("italic"); }}
        title="Italic"
        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-200 text-slate-700 text-xs italic font-semibold transition-all select-none"
      >I</button>
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); exec("underline"); }}
        title="Underline"
        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-200 text-slate-700 text-xs underline font-semibold transition-all select-none"
      >U</button>

      <div className="w-px h-4 bg-slate-200 mx-1 shrink-0" />

      {/* Color picker */}
      <div ref={colorRef} className="relative">
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); setShowColor((v) => !v); setShowEmoji(false); }}
          title="Text color"
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-200 text-base transition-all select-none"
        >🎨</button>
        {showColor && (
          <div className="absolute top-9 left-0 z-30 bg-white border border-slate-200 rounded-xl p-2.5 shadow-xl">
            <p className="text-[10px] text-slate-400 font-semibold mb-2 uppercase tracking-wide">Text Color</p>
            <div className="grid grid-cols-3 gap-1.5">
              {TOOLBAR_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); exec("foreColor", c); setShowColor(false); }}
                  className="w-6 h-6 rounded-full border-2 border-white hover:scale-125 transition-transform shadow-sm ring-1 ring-slate-200"
                  style={{ background: c }}
                  title={c}
                />
              ))}
            </div>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); exec("removeFormat"); setShowColor(false); }}
              className="mt-2 w-full text-[10px] text-center text-slate-400 hover:text-slate-600 transition-colors"
            >
              Reset formatting
            </button>
          </div>
        )}
      </div>

      {/* Emoji picker */}
      <div ref={emojiRef} className="relative">
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); setShowEmoji((v) => !v); setShowColor(false); }}
          title="Insert emoji"
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-200 text-base transition-all select-none"
        >😊</button>
        {showEmoji && (
          <div className="absolute top-9 left-0 z-30 bg-white border border-slate-200 rounded-xl p-2.5 shadow-xl w-52">
            <p className="text-[10px] text-slate-400 font-semibold mb-2 uppercase tracking-wide">Insert Emoji</p>
            <div className="grid grid-cols-8 gap-0.5">
              {TOOLBAR_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    editorRef.current?.focus();
                    document.execCommand("insertText", false, emoji);
                    setShowEmoji(false);
                  }}
                  className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-100 text-sm transition-all"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────

export default function CommsClient({
  licenseKey, ownerEmail, contactEmail, contactPhone, comms,
}: Props) {
  const router = useRouter();
  const [channel, setChannel] = useState<"email" | "whatsapp">("email");

  // ── Email state ────────────────────────────────────────────────
  const [templateId, setTemplateId]         = useState<TemplateId>("plain");
  const [toEmail, setToEmail]               = useState(contactEmail || ownerEmail);
  const [subject, setSubject]               = useState("");
  const [editorHasContent, setEditorHasContent] = useState(false);
  const [imageFile, setImageFile]           = useState<File | null>(null);
  const [imagePreview, setImagePreview]     = useState<string | null>(null);
  const [sending, setSending]               = useState(false);
  const [sendError, setSendError]           = useState<string | null>(null);
  const [sendDone, setSendDone]             = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const fileRef   = useRef<HTMLInputElement>(null);

  // ── WhatsApp state ─────────────────────────────────────────────
  const [waMsg, setWaMsg]                   = useState("");
  const [waImageFile, setWaImageFile]       = useState<File | null>(null);
  const [waImagePreview, setWaImagePreview] = useState<string | null>(null);
  const [waSending, setWaSending]           = useState(false);
  const [waDone, setWaDone]                 = useState(false);
  const [waImageCopied, setWaImageCopied]   = useState(false);
  const [waError, setWaError]               = useState<string | null>(null);
  const waFileRef = useRef<HTMLInputElement>(null);

  // ── Template picker ────────────────────────────────────────────
  function selectTemplate(id: TemplateId) {
    setTemplateId(id);
    const def = TEMPLATE_DEFS.find((t) => t.id === id);
    if (def && editorRef.current) {
      if (def.defaultSubject) setSubject(def.defaultSubject);
      editorRef.current.innerHTML = def.defaultMessage ? plainToHtml(def.defaultMessage) : "";
      setEditorHasContent(!!def.defaultMessage);
    }
    setSendError(null);
  }

  // ── Image helpers ──────────────────────────────────────────────
  function pickImage(file: File) {
    if (file.size > MAX_IMAGE_BYTES) { setSendError("Image must be under 3 MB"); return; }
    setSendError(null);
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  function removeImage() {
    setImageFile(null);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  // ── Send email ─────────────────────────────────────────────────
  async function sendEmail() {
    setSendError(null);
    const messageHtml = editorRef.current?.innerHTML ?? "";
    const messageText = editorRef.current?.innerText?.trim() ?? "";
    if (!messageText) { setSendError("Message is required"); return; }
    if (!toEmail.trim()) { setSendError("Recipient email is required"); return; }
    setSending(true);
    try {
      let imageBase64: string | null = null;
      let imageType:   string | null = null;
      if (imageFile) {
        imageBase64 = await new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload  = () => resolve((r.result as string).split(",")[1]);
          r.onerror = reject;
          r.readAsDataURL(imageFile);
        });
        imageType = imageFile.type;
      }
      const res  = await fetch("/api/admin/licenses/send-comms", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ licenseKey, templateId, subject, message: messageHtml, imageBase64, imageType, recipientEmail: toEmail }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { setSendError(json.error || "Failed to send"); return; }
      setSubject("");
      if (editorRef.current) editorRef.current.innerHTML = "";
      setEditorHasContent(false);
      removeImage();
      setSendDone(true);
      setTimeout(() => setSendDone(false), 5000);
      router.refresh();
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Network error");
    } finally {
      setSending(false);
    }
  }

  // ── WhatsApp image helpers ─────────────────────────────────────
  function pickWaImage(file: File) {
    if (file.size > MAX_IMAGE_BYTES) { setWaError("Image must be under 3 MB"); return; }
    setWaError(null);
    setWaImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setWaImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  function removeWaImage() {
    setWaImageFile(null);
    setWaImagePreview(null);
    if (waFileRef.current) waFileRef.current.value = "";
  }

  // ── Send WhatsApp ──────────────────────────────────────────────
  async function sendWhatsApp() {
    if (!waMsg.trim() && !waImageFile) return;
    setWaError(null);
    setWaImageCopied(false);
    setWaSending(true);
    try {
      // Step 1: copy image to clipboard so user can paste in WhatsApp
      let imageCopied = false;
      if (waImageFile) {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ [waImageFile.type]: waImageFile }),
          ]);
          imageCopied = true;
        } catch {
          // clipboard unavailable — will fall back to URL in message
        }
      }

      // Step 2: encode + upload image for logging
      let imageBase64: string | null = null;
      let imageType:   string | null = null;
      if (waImageFile) {
        imageBase64 = await new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload  = () => resolve((r.result as string).split(",")[1]);
          r.onerror = reject;
          r.readAsDataURL(waImageFile);
        });
        imageType = waImageFile.type;
      }

      const res  = await fetch("/api/admin/licenses/log-whatsapp", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ licenseKey, message: waMsg, recipientPhone: contactPhone, imageBase64, imageType }),
      });
      const json = await res.json().catch(() => ({}));

      // Step 3: build wa.me text
      // If clipboard copy succeeded the image is already there — no need to add URL
      // If it failed, append the uploaded URL as fallback so recipient can still see it
      const imageUrl: string | null = json.imageUrl ?? null;
      let waText = waMsg.trim();
      if (!imageCopied && imageUrl) {
        waText = waText ? `${waText}\n\n${imageUrl}` : imageUrl;
      }

      // Step 4: open WhatsApp
      const phone = contactPhone.replace(/\D/g, "");
      window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(waText)}`, "_blank");

      setWaMsg("");
      removeWaImage();
      setWaDone(true);
      setWaImageCopied(imageCopied);
      setTimeout(() => { setWaDone(false); setWaImageCopied(false); }, 10000);
      router.refresh();
    } catch (err) {
      setWaError(err instanceof Error ? err.message : "Network error");
    } finally {
      setWaSending(false);
    }
  }

  const activeTpl = TEMPLATE_DEFS.find((t) => t.id === templateId)!;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">

      {/* ── Compose ─────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900">Compose Message</h2>

        {/* Channel toggle */}
        <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
          {(["email", "whatsapp"] as const).map((ch) => (
            <button key={ch} onClick={() => { setChannel(ch); setSendError(null); setSendDone(false); setWaDone(false); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
                channel === ch ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}>
              {ch === "email" ? <Mail size={14} /> : <MessageCircle size={14} />}
              {ch === "email" ? "Email" : "WhatsApp"}
            </button>
          ))}
        </div>

        {/* ── Email form ─────────────────────────────────────────── */}
        {channel === "email" && (
          <div className="space-y-4">

            {/* Template picker */}
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2">Email Template</p>
              <div className="grid grid-cols-2 gap-2">
                {TEMPLATE_DEFS.map((tpl) => (
                  <button key={tpl.id} onClick={() => selectTemplate(tpl.id)}
                    style={templateId === tpl.id
                      ? { background: tpl.bg, borderColor: tpl.accent }
                      : undefined}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border-2 text-left transition-all ${
                      templateId === tpl.id
                        ? "border-current shadow-sm"
                        : "border-slate-100 bg-slate-50 hover:border-slate-300"
                    }`}>
                    <span className="text-xl leading-none">{tpl.emoji}</span>
                    <div className="min-w-0">
                      <p style={templateId === tpl.id ? { color: tpl.accent } : undefined}
                        className={`text-xs font-bold truncate ${templateId === tpl.id ? "" : "text-slate-700"}`}>
                        {tpl.label}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">{tpl.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Selected template badge */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold"
              style={{ background: activeTpl.bg, color: activeTpl.accent }}>
              <span>{activeTpl.emoji}</span>
              <span>Using: {activeTpl.label} template</span>
            </div>

            {/* Fields */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">To *</label>
                <input type="email" value={toEmail} onChange={(e) => setToEmail(e.target.value)}
                  placeholder="recipient@email.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-navy" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Subject</label>
                <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Warm Greetings from ShelfCure!"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-navy" />
              </div>

              {/* Rich text message editor */}
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">
                  Message *
                  {editorHasContent && (
                    <span className="ml-1.5 font-normal text-slate-400">(edit as needed)</span>
                  )}
                </label>
                <RichToolbar editorRef={editorRef} />
                <div className="relative">
                  {!editorHasContent && (
                    <div className="absolute top-0 left-0 px-3 py-2.5 text-sm text-slate-400 pointer-events-none select-none leading-relaxed">
                      Select a template above or write your message here…
                    </div>
                  )}
                  <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={() => setEditorHasContent(!!editorRef.current?.innerText?.trim())}
                    className="w-full px-3 py-2.5 border border-slate-200 border-t-0 rounded-b-xl text-sm outline-none focus:border-brand-navy min-h-[220px] max-h-[400px] overflow-y-auto leading-relaxed"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Select text to apply bold, italic, underline, or color. Use 😊 to insert emojis.
                </p>
              </div>

              {/* Image attachment */}
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Image (optional)</label>
                {imagePreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200">
                    <img src={imagePreview} alt="Preview" className="w-full max-h-44 object-cover" />
                    <button onClick={removeImage}
                      className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center bg-black/60 hover:bg-black/80 text-white rounded-full transition-all">
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => fileRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-slate-200 hover:border-brand-navy text-slate-400 hover:text-brand-navy text-sm font-medium transition-all">
                    <ImageIcon size={15} />
                    Click to attach image
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) pickImage(f); }} />
                <p className="text-[10px] text-slate-400 mt-1">Max 3 MB · JPG, PNG, WebP</p>
              </div>

              {sendError && <ErrorBox message={sendError} />}
              {sendDone  && <SuccessBox message="Email sent successfully!" />}

              <button onClick={sendEmail} disabled={sending || !editorHasContent || !toEmail.trim()}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-brand-navy text-white text-sm font-semibold rounded-xl hover:bg-brand-navy/90 transition-all disabled:opacity-50">
                <Send size={14} />
                {sending ? "Sending…" : "Send Email"}
              </button>
            </div>
          </div>
        )}

        {/* ── WhatsApp form ──────────────────────────────────────── */}
        {channel === "whatsapp" && (
          <div className="space-y-3">
            {!contactPhone && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 text-xs text-amber-700">
                <AlertCircle size={13} className="shrink-0 mt-0.5" />
                No phone number saved. Add one in the license&apos;s Contact Info section first.
              </div>
            )}
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Message *</label>
              <textarea value={waMsg} onChange={(e) => setWaMsg(e.target.value)}
                placeholder="Type your WhatsApp message…"
                rows={7}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-green-500 resize-none" />
              <p className="text-[10px] text-slate-400 text-right mt-1">{waMsg.length} chars</p>
            </div>
            {/* Image attachment */}
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Image (optional)</label>
              {waImagePreview ? (
                <div className="relative rounded-xl overflow-hidden border border-slate-200">
                  <img src={waImagePreview} alt="Preview" className="w-full max-h-40 object-cover" />
                  <button onClick={removeWaImage}
                    className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center bg-black/60 hover:bg-black/80 text-white rounded-full transition-all">
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <button onClick={() => waFileRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-slate-200 hover:border-green-500 text-slate-400 hover:text-green-600 text-sm font-medium transition-all">
                  <ImageIcon size={15} />
                  Click to attach image
                </button>
              )}
              <input ref={waFileRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) pickWaImage(f); }} />
              <p className="text-[10px] text-slate-400 mt-1">
                Image will be uploaded and its link appended to the message. Max 3 MB.
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl px-3 py-2.5 text-xs text-slate-500">
              This will open WhatsApp with your message pre-filled and automatically log it in history.
            </div>
            {waError && <ErrorBox message={waError} />}
            {waDone && (
              <div className="space-y-1.5">
                <SuccessBox message="WhatsApp opened and message logged!" />
                {waImageCopied && (
                  <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
                    <span className="text-sm shrink-0">📋</span>
                    <p className="text-xs text-blue-700 font-medium">
                      Image copied to clipboard — paste it in WhatsApp using <strong>Ctrl+V</strong> (or long-press → Paste on phone)
                    </p>
                  </div>
                )}
              </div>
            )}
            <button onClick={sendWhatsApp} disabled={(!waMsg.trim() && !waImageFile) || !contactPhone || waSending}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50">
              <MessageCircle size={14} />
              {waSending ? "Logging…" : "Open WhatsApp & Log"}
            </button>
          </div>
        )}
      </div>

      {/* ── History ──────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-900">Sent Messages</h2>
          <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
            {comms.length}
          </span>
        </div>

        {comms.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle size={28} className="text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No messages sent yet</p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[680px] overflow-y-auto">
            {comms.map((c) => <CommCard key={c.id} comm={c} />)}
          </div>
        )}
      </div>
    </div>
  );
}

// ── History card ───────────────────────────────────────────────────

function CommCard({ comm }: { comm: Communication }) {
  const [expanded, setExpanded] = useState(false);
  const isEmail = comm.channel === "email";

  const plainText = stripHtml(comm.message);
  const isLong    = plainText.length > 120;
  const tplDef    = TEMPLATE_DEFS.find((t) => t.id === (comm as any).template_id);

  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-2">
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
            isEmail ? "bg-brand-navy/10" : "bg-green-100"
          }`}>
            {isEmail
              ? <Mail size={13} className="text-brand-navy" />
              : <MessageCircle size={13} className="text-green-600" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-xs font-semibold text-slate-700 truncate">
                {isEmail ? (comm.subject || "(No subject)") : "WhatsApp"}
              </p>
              {tplDef && tplDef.id !== "plain" && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: tplDef.bg, color: tplDef.accent }}>
                  {tplDef.emoji} {tplDef.label}
                </span>
              )}
            </div>
            {comm.recipient && (
              <p className="text-[10px] text-slate-400 truncate">{comm.recipient}</p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {comm.status === "failed"
            ? <span className="flex items-center gap-1 text-[10px] font-bold text-red-500"><XCircle size={10} /> Failed</span>
            : <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600"><CheckCircle2 size={10} /> Sent</span>}
          <p className="text-[10px] text-slate-400">{formatRelative(comm.sent_at)}</p>
        </div>
      </div>

      {/* Message preview */}
      {!expanded && (
        <p className={`text-xs text-slate-600 leading-relaxed ${isLong ? "line-clamp-2" : ""}`}>
          {plainText}
        </p>
      )}
      {expanded && (
        <div
          className="text-xs text-slate-600 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: comm.message }}
        />
      )}
      {isLong && (
        <button onClick={() => setExpanded((v) => !v)}
          className="text-[10px] font-semibold text-brand-navy hover:underline">
          {expanded ? "Show less" : "Show more"}
        </button>
      )}

      {expanded && comm.image_url && (
        <img src={comm.image_url} alt="Attached" className="w-full max-h-52 object-cover rounded-lg border border-slate-200 mt-1" />
      )}
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
      <AlertCircle size={13} className="text-red-500 shrink-0 mt-0.5" />
      <p className="text-xs text-red-600 font-medium">{message}</p>
    </div>
  );
}

function SuccessBox({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
      <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
      <p className="text-xs text-emerald-700 font-medium">{message}</p>
    </div>
  );
}

function formatRelative(dateStr: string) {
  const diff  = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(mins  / 60);
  const days  = Math.floor(hours / 24);
  if (mins  < 1)  return "Just now";
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  <  7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
