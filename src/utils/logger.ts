/**
 * Simple logging utility
 * Logs to stderr to avoid interfering with stdio transport
 */

type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel) || "info";

const levels: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function shouldLog(level: LogLevel): boolean {
  return levels[level] >= levels[LOG_LEVEL];
}

function formatMessage(level: LogLevel, message: string, ...args: any[]): string {
  const timestamp = new Date().toISOString();
  const formattedArgs = args.length > 0 ? " " + args.map(arg =>
    typeof arg === "object" ? JSON.stringify(arg) : String(arg)
  ).join(" ") : "";
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
