// src/lib/brief/store.ts
//
// The subscriber store. Upstash Redis, provisioned through the Vercel
// Marketplace, holding four things: subscribers, the append-only consent log,
// per-issue send state, and feedback votes.
//
// Everything here is lazy. Nothing connects at import time, nothing throws at
// build time, and `getStore()` returns null when the integration has not been
// provisioned yet so routes can answer with a clean 503 instead of a stack
// trace. There is deliberately no in-memory fallback: a subscriber list that
// silently forgets people is worse than one that is honestly closed.
//
// Key map:
//   brief:sub:<email>            hash    one subscriber
//   brief:segment:daily          set     CONFIRMED emails wanting the daily
//   brief:segment:weekly         set     CONFIRMED emails wanting the weekly
//   brief:suppressed             set     unsubscribed or bounced, never mailed
//   brief:consent-log            list    append-only GDPR proof record
//   brief:send:<type>:<id>       hash    Phase 3 send state
//   brief:send-recipients:<...>  list    the frozen recipient list for one send
//   brief:send-log               list    append-only record of what went out
//   brief:send-lock              string  NX lock so two crons cannot both send
//   brief:feedback:<type>:<id>   hash    up/down tallies
//   brief:feedback-voters:<...>  set     emails that already voted on an issue

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { isCadence, segmentsFor, type BriefCadence } from "./cadence";

export { BRIEF_CADENCES, isCadence, segmentsFor } from "./cadence";
export type { BriefCadence } from "./cadence";

export const SUBSCRIBER_STATUSES = ["pending", "confirmed", "unsubscribed"] as const;
export type SubscriberStatus = (typeof SUBSCRIBER_STATUSES)[number];

export type Subscriber = {
  email: string;
  cadence: BriefCadence;
  status: SubscriberStatus;
  created_at: string;
  confirmed_at?: string;
  unsubscribed_at?: string;
  consent_ip?: string;
  consent_text_version: number;
  reminder_sent_at?: string;
};

export type ConsentAction = "signup" | "confirm" | "change" | "unsubscribe" | "reminder";

export type ConsentLogEntry = {
  ts: string;
  email: string;
  action: ConsentAction;
  cadence?: BriefCadence;
  ip?: string;
  consent_text_version: number;
};

export type IssueType = "daily" | "weekly";

export const SEND_STATES = [
  "pending_approval",
  "approved",
  "held",
  "sent",
  "skipped",
] as const;
export type SendStateName = (typeof SEND_STATES)[number];

export type SendState = {
  state: SendStateName;
  /** ISO timestamp after which an untouched issue sends on its own. */
  approve_by?: string;
  sent_at?: string;
  decided_via?: "approve" | "hold" | "timeout";
  /** Cursor into the recipient list, so a crashed run resumes instead of restarting. */
  recipients_done: number;
  failures: number;
};

export type FeedbackTally = { up: number; down: number };

/** One line in the append-only record of what actually went out. Phase 3. */
export type SendLogEntry = {
  ts: string;
  type: IssueType;
  id: string;
  recipients: number;
  failures: number;
  /** Timeout sends are logged distinctly; plan 04 §5 asks for exactly that. */
  decided_via: "approve" | "hold" | "timeout";
  /** What the byte-budget trim removed, if anything. */
  dropped: string[];
  driver: string;
};

export const keys = {
  subscriber: (email: string) => `brief:sub:${email}`,
  segment: (segment: "daily" | "weekly") => `brief:segment:${segment}`,
  suppressed: "brief:suppressed",
  consentLog: "brief:consent-log",
  sendState: (type: IssueType, id: string) => `brief:send:${type}:${id}`,
  feedback: (type: IssueType, id: string) => `brief:feedback:${type}:${id}`,
  feedbackVoters: (type: IssueType, id: string) => `brief:feedback-voters:${type}:${id}`,
  // Phase 3.
  sendRecipients: (type: IssueType, id: string) => `brief:send-recipients:${type}:${id}`,
  sendLog: "brief:send-log",
  sendLock: "brief:send-lock",
  subscriberPrefix: "brief:sub:",
} as const;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export type SignupInput = {
  email: string;
  cadence: BriefCadence;
  ip?: string;
  consentTextVersion: number;
  now?: Date;
};

export interface BriefStore {
  getSubscriber(email: string): Promise<Subscriber | null>;
  /** Upserts a pending subscriber. Confirmed subscribers keep their status. */
  saveSignup(input: SignupInput): Promise<Subscriber>;
  /** Marks confirmed, joins the segments, clears suppression. */
  confirmSubscriber(email: string, cadence: BriefCadence): Promise<Subscriber | null>;
  changeCadence(email: string, cadence: BriefCadence): Promise<Subscriber | null>;
  unsubscribe(email: string): Promise<Subscriber | null>;
  markReminderSent(email: string): Promise<void>;
  isSuppressed(email: string): Promise<boolean>;
  logConsent(entry: ConsentLogEntry): Promise<void>;
  readConsentLog(limit?: number): Promise<ConsentLogEntry[]>;
  segmentEmails(segment: "daily" | "weekly"): Promise<string[]>;
  segmentSize(segment: "daily" | "weekly"): Promise<number>;
  getSendState(type: IssueType, id: string): Promise<SendState | null>;
  setSendState(type: IssueType, id: string, patch: Partial<SendState>): Promise<SendState>;
  getFeedback(type: IssueType, id: string): Promise<FeedbackTally>;
  recordFeedbackVote(input: {
    type: IssueType;
    id: string;
    email: string;
    vote: "up" | "down";
  }): Promise<{ counted: boolean; tally: FeedbackTally }>;

  /* ── Phase 3: sending ─────────────────────────────────────────────────── */

  /** SET NX with a TTL. False means another cron tick is already sending. */
  acquireSendLock(ttlSeconds: number): Promise<boolean>;
  releaseSendLock(): Promise<void>;
  /**
   * A coarse "not more often than this" gate, for the housekeeping the cron
   * does alongside sending. False means somebody already did it recently.
   */
  claimPeriodicTask(name: string, ttlSeconds: number): Promise<boolean>;
  /**
   * The recipient list is frozen on the first pass of a send and read back on
   * every resume, so the `recipients_done` cursor keeps pointing at the same
   * person even if the segment gains or loses members mid-send.
   */
  saveSendRecipients(type: IssueType, id: string, emails: string[]): Promise<void>;
  getSendRecipients(type: IssueType, id: string): Promise<string[]>;
  /** The whole suppression set, so a send does not do one round trip per address. */
  suppressedEmails(): Promise<string[]>;
  /**
   * Every subscriber, confirmed or not. The segments only hold confirmed
   * addresses, and the 24h reminder is aimed at exactly the ones missing from
   * them, so this walks the key space instead.
   */
  listSubscriberEmails(max?: number): Promise<string[]>;
  /**
   * HSETNX on the subscriber hash: true only for the caller that set the field
   * first. This is the guard that keeps a welcome-sequence email to one send
   * per person even if two runs overlap.
   */
  claimSubscriberFlag(email: string, field: string, value: string): Promise<boolean>;
  /** Releases a claim whose send then failed, so the next run can retry it. */
  clearSubscriberFlag(email: string, field: string): Promise<void>;
  appendSendLog(entry: SendLogEntry): Promise<void>;
  readSendLog(limit?: number): Promise<SendLogEntry[]>;
}

/* ── Redis plumbing ─────────────────────────────────────────────────────── */

type RedisConfig = { url: string; token: string };

/**
 * The Vercel Marketplace integration injects UPSTASH_REDIS_REST_*; older
 * Vercel KV wiring injects KV_REST_API_*. Both name the same database.
 */
function redisConfig(): RedisConfig | null {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return { url, token };
}

export function isStoreConfigured(): boolean {
  return redisConfig() !== null;
}

let cachedRedis: { config: RedisConfig; client: Redis } | null = null;

function getRedis(): Redis | null {
  const config = redisConfig();
  if (!config) return null;
  if (cachedRedis && cachedRedis.config.url === config.url && cachedRedis.config.token === config.token) {
    return cachedRedis.client;
  }
  const client = new Redis({ url: config.url, token: config.token });
  cachedRedis = { config, client };
  return client;
}

/* ── Row coercion ───────────────────────────────────────────────────────── */

type Row = Record<string, unknown>;

function str(row: Row, field: string): string | undefined {
  const value = row[field];
  if (value === null || value === undefined || value === "") return undefined;
  return String(value);
}

function subscriberFromRow(row: Row | null): Subscriber | null {
  if (!row) return null;
  const email = str(row, "email");
  if (!email) return null;
  const cadence = str(row, "cadence");
  const status = str(row, "status");
  return {
    email,
    cadence: isCadence(cadence) ? cadence : "weekly",
    status: (SUBSCRIBER_STATUSES as readonly string[]).includes(status ?? "")
      ? (status as SubscriberStatus)
      : "pending",
    created_at: str(row, "created_at") ?? new Date(0).toISOString(),
    confirmed_at: str(row, "confirmed_at"),
    unsubscribed_at: str(row, "unsubscribed_at"),
    consent_ip: str(row, "consent_ip"),
    consent_text_version: Number(str(row, "consent_text_version") ?? 1) || 1,
    reminder_sent_at: str(row, "reminder_sent_at"),
  };
}

function sendStateFromRow(row: Row | null): SendState | null {
  if (!row) return null;
  const state = str(row, "state");
  if (!state || !(SEND_STATES as readonly string[]).includes(state)) return null;
  const decided = str(row, "decided_via");
  return {
    state: state as SendStateName,
    approve_by: str(row, "approve_by"),
    sent_at: str(row, "sent_at"),
    decided_via:
      decided === "approve" || decided === "hold" || decided === "timeout" ? decided : undefined,
    recipients_done: Number(str(row, "recipients_done") ?? 0) || 0,
    failures: Number(str(row, "failures") ?? 0) || 0,
  };
}

/** Redis hashes cannot hold undefined; dropping the key keeps the old value. */
function definedOnly(fields: Record<string, string | number | undefined>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) out[key] = String(value);
  }
  return out;
}

/* ── The store ──────────────────────────────────────────────────────────── */

export function createRedisStore(redis: Redis): BriefStore {
  async function readSubscriber(email: string): Promise<Subscriber | null> {
    const row = await redis.hgetall<Row>(keys.subscriber(email));
    return subscriberFromRow(row);
  }

  async function leaveAllSegments(email: string): Promise<void> {
    await Promise.all([
      redis.srem(keys.segment("daily"), email),
      redis.srem(keys.segment("weekly"), email),
    ]);
  }

  async function readFeedback(type: IssueType, id: string): Promise<FeedbackTally> {
    const row = await redis.hgetall<Row>(keys.feedback(type, id));
    return {
      up: Number(str(row ?? {}, "up") ?? 0) || 0,
      down: Number(str(row ?? {}, "down") ?? 0) || 0,
    };
  }

  async function joinSegments(email: string, cadence: BriefCadence): Promise<void> {
    const wanted = segmentsFor(cadence);
    await Promise.all(
      (["daily", "weekly"] as const).map((segment) =>
        wanted.includes(segment)
          ? redis.sadd(keys.segment(segment), email)
          : redis.srem(keys.segment(segment), email),
      ),
    );
  }

  return {
    async getSubscriber(email) {
      return readSubscriber(normalizeEmail(email));
    },

    async saveSignup(input) {
      const email = normalizeEmail(input.email);
      const now = (input.now ?? new Date()).toISOString();
      const existing = await readSubscriber(email);

      // A confirmed subscriber who signs up again keeps their confirmed status
      // and their current cadence: the cadence they typed into the form only
      // takes effect when they click the fresh confirmation link.
      const status: SubscriberStatus = existing?.status === "confirmed" ? "confirmed" : "pending";
      const cadence = existing?.status === "confirmed" ? existing.cadence : input.cadence;

      await redis.hset(
        keys.subscriber(email),
        definedOnly({
          email,
          cadence,
          status,
          created_at: existing?.created_at ?? now,
          consent_ip: input.ip,
          consent_text_version: input.consentTextVersion,
        }),
      );

      return {
        email,
        cadence,
        status,
        created_at: existing?.created_at ?? now,
        confirmed_at: existing?.confirmed_at,
        unsubscribed_at: existing?.unsubscribed_at,
        consent_ip: input.ip ?? existing?.consent_ip,
        consent_text_version: input.consentTextVersion,
        reminder_sent_at: existing?.reminder_sent_at,
      };
    },

    async confirmSubscriber(email, cadence) {
      const key = normalizeEmail(email);
      const existing = await readSubscriber(key);
      if (!existing) return null;
      const now = new Date().toISOString();

      await redis.hset(
        keys.subscriber(key),
        definedOnly({
          email: key,
          cadence,
          status: "confirmed",
          confirmed_at: existing.confirmed_at ?? now,
          unsubscribed_at: "",
        }),
      );
      // Confirming is a fresh double opt-in, which is the only way back off the
      // suppression list.
      await redis.srem(keys.suppressed, key);
      await joinSegments(key, cadence);

      return { ...existing, cadence, status: "confirmed", confirmed_at: existing.confirmed_at ?? now };
    },

    async changeCadence(email, cadence) {
      const key = normalizeEmail(email);
      const existing = await readSubscriber(key);
      if (!existing) return null;

      await redis.hset(keys.subscriber(key), definedOnly({ cadence }));
      if (existing.status === "confirmed") {
        await joinSegments(key, cadence);
      }
      return { ...existing, cadence };
    },

    async unsubscribe(email) {
      const key = normalizeEmail(email);
      const existing = await readSubscriber(key);
      const now = new Date().toISOString();

      await leaveAllSegments(key);
      await redis.sadd(keys.suppressed, key);
      if (!existing) return null;

      await redis.hset(
        keys.subscriber(key),
        definedOnly({ status: "unsubscribed", unsubscribed_at: now }),
      );
      return { ...existing, status: "unsubscribed", unsubscribed_at: now };
    },

    async markReminderSent(email) {
      await redis.hset(
        keys.subscriber(normalizeEmail(email)),
        definedOnly({ reminder_sent_at: new Date().toISOString() }),
      );
    },

    async isSuppressed(email) {
      const member = await redis.sismember(keys.suppressed, normalizeEmail(email));
      return member === 1;
    },

    async logConsent(entry) {
      await redis.rpush(keys.consentLog, JSON.stringify(entry));
    },

    async readConsentLog(limit = 100) {
      const rows = await redis.lrange<string | ConsentLogEntry>(keys.consentLog, -limit, -1);
      return rows
        .map((row) => {
          if (typeof row !== "string") return row as ConsentLogEntry;
          try {
            return JSON.parse(row) as ConsentLogEntry;
          } catch {
            return null;
          }
        })
        .filter((row): row is ConsentLogEntry => row !== null);
    },

    async segmentEmails(segment) {
      return (await redis.smembers(keys.segment(segment))) as string[];
    },

    async segmentSize(segment) {
      return redis.scard(keys.segment(segment));
    },

    async getSendState(type, id) {
      const row = await redis.hgetall<Row>(keys.sendState(type, id));
      return sendStateFromRow(row);
    },

    async setSendState(type, id, patch) {
      const key = keys.sendState(type, id);
      const current = sendStateFromRow(await redis.hgetall<Row>(key));
      const next: SendState = {
        state: patch.state ?? current?.state ?? "pending_approval",
        approve_by: patch.approve_by ?? current?.approve_by,
        sent_at: patch.sent_at ?? current?.sent_at,
        decided_via: patch.decided_via ?? current?.decided_via,
        recipients_done: patch.recipients_done ?? current?.recipients_done ?? 0,
        failures: patch.failures ?? current?.failures ?? 0,
      };
      await redis.hset(
        key,
        definedOnly({
          state: next.state,
          approve_by: next.approve_by,
          sent_at: next.sent_at,
          decided_via: next.decided_via,
          recipients_done: next.recipients_done,
          failures: next.failures,
        }),
      );
      return next;
    },

    async getFeedback(type, id) {
      return readFeedback(type, id);
    },

    async recordFeedbackVote({ type, id, email, vote }) {
      const key = normalizeEmail(email);
      const added = await redis.sadd(keys.feedbackVoters(type, id), key);
      if (added === 0) {
        return { counted: false, tally: await readFeedback(type, id) };
      }
      await redis.hincrby(keys.feedback(type, id), vote, 1);
      return { counted: true, tally: await readFeedback(type, id) };
    },

    /* ── Phase 3: sending ───────────────────────────────────────────────── */

    async acquireSendLock(ttlSeconds) {
      const result = await redis.set(keys.sendLock, new Date().toISOString(), {
        nx: true,
        ex: ttlSeconds,
      });
      return result === "OK";
    },

    async releaseSendLock() {
      await redis.del(keys.sendLock);
    },

    async claimPeriodicTask(name, ttlSeconds) {
      const result = await redis.set(`brief:task:${name}`, new Date().toISOString(), {
        nx: true,
        ex: ttlSeconds,
      });
      return result === "OK";
    },

    async saveSendRecipients(type, id, emails) {
      const key = keys.sendRecipients(type, id);
      await redis.del(key);
      // Upstash caps a single command's payload, and a list this long is rare
      // enough that chunking costs nothing.
      for (let start = 0; start < emails.length; start += 500) {
        const chunk = emails.slice(start, start + 500);
        if (chunk.length > 0) await redis.rpush(key, ...chunk);
      }
      // The list outlives the send by a month so a post-mortem can read it.
      await redis.expire(key, 30 * 24 * 60 * 60);
    },

    async getSendRecipients(type, id) {
      return (await redis.lrange<string>(keys.sendRecipients(type, id), 0, -1)) ?? [];
    },

    async suppressedEmails() {
      return (await redis.smembers(keys.suppressed)) as string[];
    },

    async listSubscriberEmails(max = 5000) {
      const emails: string[] = [];
      let cursor: string | number = 0;
      do {
        const scanned: [string | number, string[]] = await redis.scan(cursor, {
          match: `${keys.subscriberPrefix}*`,
          count: 200,
        });
        const [next, batch] = scanned;
        for (const key of batch) {
          emails.push(String(key).slice(keys.subscriberPrefix.length));
        }
        cursor = next;
      } while (String(cursor) !== "0" && emails.length < max);
      return emails.slice(0, max);
    },

    async claimSubscriberFlag(email, field, value) {
      const claimed = await redis.hsetnx(keys.subscriber(normalizeEmail(email)), field, value);
      return claimed === 1;
    },

    async clearSubscriberFlag(email, field) {
      await redis.hdel(keys.subscriber(normalizeEmail(email)), field);
    },

    async appendSendLog(entry) {
      await redis.rpush(keys.sendLog, JSON.stringify(entry));
    },

    async readSendLog(limit = 100) {
      const rows = await redis.lrange<string | SendLogEntry>(keys.sendLog, -limit, -1);
      return rows
        .map((row) => {
          if (typeof row !== "string") return row as SendLogEntry;
          try {
            return JSON.parse(row) as SendLogEntry;
          } catch {
            return null;
          }
        })
        .filter((row): row is SendLogEntry => row !== null);
    },
  };
}

let cachedStore: { client: Redis; store: BriefStore } | null = null;

/** The store, or null when the Redis integration has not been provisioned. */
export function getStore(): BriefStore | null {
  const redis = getRedis();
  if (!redis) return null;
  if (cachedStore?.client === redis) return cachedStore.store;
  const store = createRedisStore(redis);
  cachedStore = { client: redis, store };
  return store;
}

/* ── Rate limits ────────────────────────────────────────────────────────── */

export type SubscribeLimiters = { perIp: Ratelimit; perEmail: Ratelimit };

let cachedLimiters: { client: Redis; limiters: SubscribeLimiters } | null = null;

/**
 * Sliding windows: 5 signups an hour from one address, 3 a day for one email.
 * The second one is what stops a stranger's inbox from being used as a target.
 */
export function getSubscribeLimiters(): SubscribeLimiters | null {
  const redis = getRedis();
  if (!redis) return null;
  if (cachedLimiters?.client === redis) return cachedLimiters.limiters;

  const limiters: SubscribeLimiters = {
    perIp: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "1 h"),
      prefix: "brief:rl:subscribe:ip",
      analytics: false,
    }),
    perEmail: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, "1 d"),
      prefix: "brief:rl:subscribe:email",
      analytics: false,
    }),
  };
  cachedLimiters = { client: redis, limiters };
  return limiters;
}

let cachedTokenLimiter: { client: Redis; limiter: Ratelimit } | null = null;

/** Guards the token-authed routes against someone grinding at signatures. */
export function getTokenActionLimiter(): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;
  if (cachedTokenLimiter?.client === redis) return cachedTokenLimiter.limiter;
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, "1 h"),
    prefix: "brief:rl:token:ip",
    analytics: false,
  });
  cachedTokenLimiter = { client: redis, limiter };
  return limiter;
}
