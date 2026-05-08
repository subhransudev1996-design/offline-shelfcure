const BASE = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

export async function sendMessage(
  chatId: string | number,
  text: string,
  extra: Record<string, unknown> = {}
): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
        ...extra,
      }),
    });
    const data = await res.json();
    if (!data.ok) {
      console.error("telegram sendMessage error:", data.description, "chat_id:", chatId);
    }
    return data.ok === true;
  } catch (err) {
    console.error("telegram sendMessage fetch error:", err);
    return false;
  }
}

export async function setWebhook(url: string, secretToken: string): Promise<unknown> {
  const res = await fetch(`${BASE}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, secret_token: secretToken, drop_pending_updates: true }),
  });
  return res.json();
}
