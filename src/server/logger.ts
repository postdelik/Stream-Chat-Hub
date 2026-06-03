import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const APP_DIR = path.join(os.homedir(), ".stream-chat-hub");
const LOGS_DIR = path.join(APP_DIR, "logs");

const APP_LOG_FILE = path.join(LOGS_DIR, "app.log");
const SERVER_LOG_FILE = path.join(LOGS_DIR, "server.log");
const TWITCH_LOG_FILE = path.join(LOGS_DIR, "twitch.log");
const UPDATES_LOG_FILE = path.join(LOGS_DIR, "updates.log");
const ERRORS_LOG_FILE = path.join(LOGS_DIR, "errors.log");

type LogLevel = "info" | "warn" | "error";

function ensureLogsDir() {
  if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
  }
}

function formatMeta(meta?: unknown) {
  if (meta === undefined) {
    return "";
  }

  try {
    return ` ${JSON.stringify(meta)}`;
  } catch {
    return ` ${String(meta)}`;
  }
}

function writeLog(filePath: string, level: LogLevel, message: string, meta?: unknown) {
  ensureLogsDir();

  const line = [
    new Date().toISOString(),
    level.toUpperCase(),
    message,
    formatMeta(meta),
  ]
    .join(" ")
    .trim();

  fs.appendFileSync(filePath, `${line}\n`, "utf-8");
}

export const logger = {
  app(message: string, meta?: unknown) {
    writeLog(APP_LOG_FILE, "info", message, meta);
  },

  server(message: string, meta?: unknown) {
    writeLog(SERVER_LOG_FILE, "info", message, meta);
  },

  twitch(message: string, meta?: unknown) {
    writeLog(TWITCH_LOG_FILE, "info", message, meta);
  },

  updates(message: string, meta?: unknown) {
    writeLog(UPDATES_LOG_FILE, "info", message, meta);
  },

  warn(message: string, meta?: unknown) {
    writeLog(APP_LOG_FILE, "warn", message, meta);
  },

  error(message: string, meta?: unknown) {
    writeLog(ERRORS_LOG_FILE, "error", message, meta);
  },
};

export function getLogsDir() {
  ensureLogsDir();
  return LOGS_DIR;
}

export function getLogFiles() {
  ensureLogsDir();

  return {
    app: APP_LOG_FILE,
    server: SERVER_LOG_FILE,
    twitch: TWITCH_LOG_FILE,
    updates: UPDATES_LOG_FILE,
    errors: ERRORS_LOG_FILE,
  };
}

export function clearLogFiles() {
  ensureLogsDir();

  const logFiles = Object.values(getLogFiles());

  for (const filePath of logFiles) {
    fs.writeFileSync(filePath, "", "utf-8");
  }

  logger.app("Logs cleared");
}