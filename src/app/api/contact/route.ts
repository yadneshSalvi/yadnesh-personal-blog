import { NextResponse } from "next/server";
export const runtime = "nodejs";
import nodemailer from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";

function required(envVar?: string, name?: string): string {
  if (!envVar) throw new Error(`Missing env: ${name}`);
  return envVar;
}

export async function POST(request: Request) {
  try {
    // Read env and create transporter lazily at request time (avoids build-time failures)
    const smtpHost = required(process.env.ZOHO_SMTP_HOST, "ZOHO_SMTP_HOST");
    const smtpPort = Number(process.env.ZOHO_SMTP_PORT ?? 465);
    const smtpUser = required(process.env.ZOHO_SMTP_USER, "ZOHO_SMTP_USER");
    const smtpPass = required(process.env.ZOHO_SMTP_PASS, "ZOHO_SMTP_PASS");
    const fromEmail = process.env.ZOHO_FROM_EMAIL || smtpUser;
    const notifyTo = required(process.env.NOTIFY_TO_EMAIL, "NOTIFY_TO_EMAIL");

    async function getTransporterWithFallback() {
      const primary = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 20000,
        family: 4,
        // Be explicit about TLS settings
        tls: {
          minVersion: "TLSv1.2",
          servername: smtpHost,
          rejectUnauthorized: true,
        },
      } as SMTPTransport.Options);
      try {
        await primary.verify();
        return primary;
      } catch (err: unknown) {
        const code = (err as { code?: string })?.code || "";
        // Only abort on clear auth errors; otherwise try STARTTLS on 587
        if (code === "EAUTH") throw err;
      }
      const secondary = nodemailer.createTransport({
        host: smtpHost,
        port: 587,
        secure: false,
        requireTLS: true,
        auth: { user: smtpUser, pass: smtpPass },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 20000,
        family: 4,
        tls: {
          minVersion: "TLSv1.2",
          servername: smtpHost,
          rejectUnauthorized: true,
        },
      } as SMTPTransport.Options);
      await secondary.verify();
      return secondary;
    }
    const transporter = await getTransporterWithFallback();

    const body = await request.json().catch(() => ({}));
    const { name, email, subject, message, botToggle, handle } = body as Record<string, string> & { botToggle?: boolean };

    // Basic validations
    if (!name || !email || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    if (!botToggle) {
      return NextResponse.json({ error: "Anti-bot toggle not enabled" }, { status: 400 });
    }
    // Honeypot: if filled, drop silently as success
    if (handle && String(handle).trim().length > 0) {
      return NextResponse.json({ ok: true });
    }

    const safeSubject = subject?.trim() ? subject.trim().slice(0, 200) : "New contact message";

    // Owner notification email
    const ownerText = `New message received on the blog contact form\n\n` +
      `From: ${name} <${email}>\n` +
      `Subject: ${safeSubject}\n\n` +
      `Message:\n${message}`;

    const ownerHtml = `
      <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; line-height:1.6;">
        <h2 style="margin:0 0 8px;">📨 New inbound transmission</h2>
        <p style="margin:0 0 8px; color:#475569;">A message just landed via <strong>contact form</strong>.</p>
        <pre style="background:#0b1220; color:#e2e8f0; padding:12px; border-radius:8px; white-space:pre-wrap;"><code>from: ${name} &lt;${email}&gt;
subject: ${safeSubject}
--- message ---
${escapeHtml(message)}</code></pre>
        <p style="margin-top:12px; color:#64748b;">Reply directly to the sender to continue the thread.</p>
      </div>
    `;

    // Acknowledgement to sender
    const ackSubject = `We got your message${subject?.trim() ? `: ${safeSubject}` : ""}`;
    const ackText = `Hey ${name},\n\n` +
      `Your message has been queued for human review. Our tiny cluster of neurons will get back to you shortly.\n\n` +
      `In the meantime, here's a receipt for your message:\n` +
      `---\n${message}\n---\n\n` +
      `Regards,\nYadnesh's Blog Robot`;
    const ackHtml = `
      <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; line-height:1.6;">
        <h2 style="margin:0 0 8px;">✅ Message received</h2>
        <p style="margin:0 0 8px; color:#475569;">Hey ${escapeHtml(name)}, thanks for reaching out! Your message is in the queue.</p>
        <pre style="background:#0b1220; color:#e2e8f0; padding:12px; border-radius:8px; white-space:pre-wrap;"><code>${escapeHtml(message)}</code></pre>
        <p style="margin-top:12px; color:#64748b;">I'll reply as soon as possible. — Yadnesh</p>
      </div>
    `;

    await transporter.sendMail({
      from: fromEmail,
      to: notifyTo,
      replyTo: `${name} <${email}>`,
      subject: `[Contact] ${safeSubject}`,
      text: ownerText,
      html: ownerHtml,
    });

    await transporter.sendMail({
      from: fromEmail,
      to: email,
      subject: ackSubject,
      text: ackText,
      html: ackHtml,
    });

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const code = (error as { code?: string })?.code;
    return NextResponse.json({ error: message, code }, { status: 500 });
  }
}

function escapeHtml(input: string) {
  return String(input)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


