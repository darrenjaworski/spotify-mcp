/**
 * Simple logging utility
 * Logs to stderr to avoid interfering with stdio transport
 * Automatically redacts sensitive data (tokens, secrets, passwords)
 */

type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel) || "info";

const levels: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Sensitive field names that should be redacted
const SENSITIVE_FIELDS = [
  'token', 'accessToken', 'refreshToken', 'access_token', 'refresh_token',
  'secret', 'clientSecret', 'client_secret', 'password', 'apiKey', 'api_key',
  'authorization', 'auth', 'bearer'
];

/**
 * Recursively redact sensitive fields from objects
 */
function redactSensitiveData(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    // Redact if string looks like a token (long alphanumeric strings)
    if (obj.length > 20 && /^[A-Za-z0-9_-]+$/.test(obj)) {
      return '[REDACTED]';
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => redactSensitiveData(item));
  }

  if (typeof obj === 'object') {
    const redacted: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (SENSITIVE_FIELDS.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
        redacted[key] = '[REDACTED]';
      } else {
        redacted[key] = redactSensitiveData(value);
      }
    }
    return redacted;
  }

  return obj;
}

function shouldLog(level: LogLevel): boolean {
  return levels[level] >= levels[LOG_LEVEL];
}

function formatMessage(level: LogLevel, message: string, ...args: any[]): string {
  const timestamp = new Date().toISOString();
  const formattedArgs = args.length > 0 ? " " + args.map(arg => {
    if (typeof arg === "object") {
      const redacted = redactSensitiveData(arg);
      return JSON.stringify(redacted);
    }
    return String(arg);
  }).join(" ") : "";
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${formattedArgs}`;
}

export const logger = {
  debug(message: string, ...args: any[]) {
    if (shouldLog("debug")) {
      console.error(formatMessage("debug", message, ...args));
    }
  },

  info(message: string, ...args: any[]) {
    if (shouldLog("info")) {
      console.error(formatMessage("info", message, ...args));
    }
  },

  warn(message: string, ...args: any[]) {
    if (shouldLog("warn")) {
      console.error(formatMessage("warn", message, ...args));
    }
  },

  error(message: string, ...args: any[]) {
    if (shouldLog("error")) {
      console.error(formatMessage("error", message, ...args));
    }
  },
};
