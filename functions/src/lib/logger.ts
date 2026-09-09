type LogLevel = "debug" | "info" | "warn" | "error";

type LogFields = Record<string, unknown>;

const SENSITIVE_KEYS = [
  "client_secret",
  "clientSecret",
  "access_token",
  "accessToken",
  "webhookSigningKey",
  "signingKey",
  "authorization",
  "password",
  "card",
  "cvv",
];

function redact(value: unknown, key?: string): unknown {
  if (
    key &&
    SENSITIVE_KEYS.some((k) => key.toLowerCase().includes(k.toLowerCase()))
  ) {
    return "[REDACTED]";
  }
  if (Array.isArray(value)) {
    return value.map((item) => redact(item));
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = redact(v, k);
    }
    return out;
  }
  if (
    typeof value === "string" &&
    value.length > 24 &&
    key?.toLowerCase().includes("token")
  ) {
    return "[REDACTED]";
  }
  return value;
}

function write(level: LogLevel, event: string, fields?: LogFields) {
  const payload = {
    level,
    event,
    ts: new Date().toISOString(),
    ...(fields ? (redact(fields) as LogFields) : {}),
  };
  const line = JSON.stringify(payload);
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  debug: (event: string, fields?: LogFields) => write("debug", event, fields),
  info: (event: string, fields?: LogFields) => write("info", event, fields),
  warn: (event: string, fields?: LogFields) => write("warn", event, fields),
  error: (event: string, fields?: LogFields) => write("error", event, fields),
};
