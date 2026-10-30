import nodemailer from "nodemailer";

/**
 * Invio email. Due possibilità, si usa la prima configurata:
 * - SMTP (es. Gmail): SMTP_USER e SMTP_PASS (per Gmail una "password per le app"),
 *   SMTP_HOST/SMTP_PORT facoltativi (predefiniti smtp.gmail.com:465);
 * - Resend (resend.com): RESEND_API_KEY.
 * EMAIL_FROM è il mittente, es. "Amanah <ordini@tuodominio.it>"; con SMTP vale di default SMTP_USER.
 * Senza configurazione l'email non parte e i link restano disponibili nel sito e nel pannello admin.
 */
export async function sendEmail(msg: { to: string; subject: string; html: string }): Promise<boolean> {
  const { SMTP_USER, SMTP_PASS, RESEND_API_KEY, EMAIL_FROM } = process.env;

  if (SMTP_USER && SMTP_PASS) {
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT || 465),
      secure: Number(process.env.SMTP_PORT || 465) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS.replace(/\s+/g, "") },
    });
    try {
      await transport.sendMail({ from: EMAIL_FROM || `Amanah <${SMTP_USER}>`, to: msg.to, subject: msg.subject, html: msg.html });
      return true;
    } catch (err) {
      console.error("Invio email SMTP fallito:", err);
      return false;
    }
  }

  if (RESEND_API_KEY && EMAIL_FROM) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: EMAIL_FROM, to: [msg.to], subject: msg.subject, html: msg.html }),
    });
    if (!res.ok) console.error(`Invio email fallito (${res.status}): ${await res.text()}`);
    return res.ok;
  }

  console.log(`Email non configurata, non inviata: "${msg.subject}" a ${msg.to}`);
  return false;
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
