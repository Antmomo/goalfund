/**
 * Invio email con Resend (resend.com). Servono RESEND_API_KEY e EMAIL_FROM,
 * es. "Amanah <ordini@tuodominio.it>". Senza configurazione l'email non parte
 * e i link restano disponibili nel sito e nel pannello admin.
 */
export async function sendEmail(msg: { to: string; subject: string; html: string }): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) {
    console.log(`Email non configurata, non inviata: "${msg.subject}" a ${msg.to}`);
    return false;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [msg.to], subject: msg.subject, html: msg.html }),
  });
  if (!res.ok) console.error(`Invio email fallito (${res.status}): ${await res.text()}`);
  return res.ok;
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
