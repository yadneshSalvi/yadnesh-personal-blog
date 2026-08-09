// src/lib/brief/mailer.ts
//
// The sender. One interface, two drivers: Resend's REST API (preferred when
// RESEND_API_KEY is set; the domain is verified there) and Zoho SMTP through
// nodemailer as the fallback. BRIEF_MAIL_DRIVER=resend|zoho-smtp forces one.
//
// Env is read inside the call, never at module load, so a build with no mail
// credentials still succeeds and a route can answer 503 instead of crashing.

import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import type { Transporter } from "nodemailer";

export type BriefEmailKind = "transactional" | "issue";

export type BriefEmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
  headers?: Record<string, string>;
  replyTo?: string;
  /**
   * "transactional" is confirmations, welcome, and approval notices.
   * "issue" is the newsletter itself, which is what CAN-SPAM calls marketing
   * and what the postal-address rule binds to.
   */
  kind: BriefEmailKind;
};

export type BriefSendResult = { id?: string; driver: string };

export interface BriefMailDriver {
  readonly name: string;
  send(message: BriefEmailMessage): Promise<BriefSendResult>;
}

export const BRIEF_FROM_NAME = "The Agentic Brief";

type ZohoConfig = {
  host: string;
  port: number;
  user: string;
  pass: string;
};

function zohoConfig(): ZohoConfig | null {
  const host = process.env.NEWSLETTER_ZOHO_SMTP_HOST;
  const user = process.env.NEWSLETTER_ZOHO_SMTP_USER;
  const pass = process.env.NEWSLETTER_ZOHO_SMTP_PASS;
  if (!host || !user || !pass) return null;
  return { host, user, pass, port: Number(process.env.NEWSLETTER_ZOHO_SMTP_PORT ?? 465) };
}

function resendApiKey(): string | null {
  return process.env.RESEND_API_KEY || null;
}

export function isMailerConfigured(): boolean {
  return resendApiKey() !== null || zohoConfig() !== null;
}

/**
 * The sending identity. BRIEF_FROM_EMAIL overrides; otherwise the Zoho SMTP
 * user (newsletter@yadneshsalvi.com) stays the one source for both drivers.
 */
export function briefFromAddress(): { address: string; formatted: string } | null {
  const address = process.env.BRIEF_FROM_EMAIL || zohoConfig()?.user;
  if (!address) return null;
  return { address, formatted: `${BRIEF_FROM_NAME} <${address}>` };
}

/**
 * RFC 8058. The mailto is the fallback for clients that will not POST, and the
 * https URL is what Gmail and Outlook actually hit behind their own button.
 */
export function oneClickUnsubscribeHeaders(unsubUrl: string): Record<string, string> {
  const from = briefFromAddress();
  const mailto = from ? `<mailto:${from.address}?subject=unsubscribe>, ` : "";
  return {
    "List-Unsubscribe": `${mailto}<${unsubUrl}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}

function transportOptions(config: ZohoConfig, port: number): SMTPTransport.Options {
  return {
    host: config.host,
    port,
    secure: port === 465,
    requireTLS: port !== 465,
    auth: { user: config.user, pass: config.pass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
    family: 4,
    tls: {
      minVersion: "TLSv1.2",
      servername: config.host,
      rejectUnauthorized: true,
    },
  } as SMTPTransport.Options;
}

let cachedTransport: { key: string; transporter: Transporter } | null = null;

/**
 * Same shape as the contact route: try the configured port, and if it fails for
 * anything other than bad credentials, fall back to STARTTLS on 587.
 */
async function getTransporter(config: ZohoConfig): Promise<Transporter> {
  const key = `${config.host}:${config.port}:${config.user}`;
  if (cachedTransport?.key === key) return cachedTransport.transporter;

  const primary = nodemailer.createTransport(transportOptions(config, config.port));
  try {
    await primary.verify();
    cachedTransport = { key, transporter: primary };
    return primary;
  } catch (error: unknown) {
    if ((error as { code?: string })?.code === "EAUTH") throw error;
  }

  const secondary = nodemailer.createTransport(transportOptions(config, 587));
  await secondary.verify();
  cachedTransport = { key, transporter: secondary };
  return secondary;
}

function zohoDriver(config: ZohoConfig): BriefMailDriver {
  return {
    name: "zoho-smtp",
    async send(message) {
      const transporter = await getTransporter(config);
      const info = await transporter.sendMail({
        from: `${BRIEF_FROM_NAME} <${config.user}>`,
        to: message.to,
        replyTo: message.replyTo ?? config.user,
        subject: message.subject,
        text: message.text,
        html: message.html,
        headers: message.headers,
      });
      return { id: info.messageId, driver: "zoho-smtp" };
    },
  };
}

function resendDriver(apiKey: string): BriefMailDriver {
  return {
    name: "resend",
    async send(message) {
      const from = briefFromAddress();
      if (!from) throw new MailerNotConfiguredError();
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: from.formatted,
          to: [message.to],
          reply_to: message.replyTo ?? from.address,
          subject: message.subject,
          html: message.html,
          text: message.text,
          headers: message.headers,
        }),
        signal: AbortSignal.timeout(20000),
      });
      if (!response.ok) {
        // Body first, so a key never lands in a log through the error path.
        const detail = await response.text().catch(() => "");
        throw new Error(
          `Resend send failed: HTTP ${response.status} ${detail.slice(0, 300)}`
        );
      }
      const data = (await response.json()) as { id?: string };
      return { id: data.id, driver: "resend" };
    },
  };
}

/**
 * The active driver, or null when no mail credentials are configured.
 * Resend wins when its key is present; BRIEF_MAIL_DRIVER forces a choice.
 */
export function getMailDriver(): BriefMailDriver | null {
  const forced = process.env.BRIEF_MAIL_DRIVER;
  const apiKey = resendApiKey();
  const config = zohoConfig();
  if (forced === "resend") return apiKey ? resendDriver(apiKey) : null;
  if (forced === "zoho-smtp") return config ? zohoDriver(config) : null;
  if (apiKey) return resendDriver(apiKey);
  if (config) return zohoDriver(config);
  return null;
}

export class MailerNotConfiguredError extends Error {
  constructor() {
    super("No brief mail driver is configured");
    this.name = "MailerNotConfiguredError";
  }
}

export async function sendBriefEmail(message: BriefEmailMessage): Promise<BriefSendResult> {
  const driver = getMailDriver();
  if (!driver) throw new MailerNotConfiguredError();
  return driver.send(message);
}
