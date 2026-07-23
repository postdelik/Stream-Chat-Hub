import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import AdmZip from "adm-zip";
import type {
  AppSettings,
  DiagnosticsArchiveResult,
  DiagnosticsInfo,
} from "../shared/types";
import { getLogFiles, getLogsDir, logger } from "./logger";

const APP_DIR = path.join(os.homedir(), ".stream-chat-hub");
const DIAGNOSTICS_DIR = path.join(APP_DIR, "diagnostics");

function ensureDiagnosticsDir() {
  if (!fs.existsSync(DIAGNOSTICS_DIR)) {
    fs.mkdirSync(DIAGNOSTICS_DIR, { recursive: true });
  }
}

function makeTimestamp() {
  return new Date()
    .toISOString()
    .replaceAll(":", "-")
    .replaceAll(".", "-");
}

function fileExists(filePath: string) {
  return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
}

function redactAuth<T extends AppSettings>(settings: T): AppSettings {
  return {
    ...settings,
    twitchAuth: settings.twitchAuth
      ? {
          ...settings.twitchAuth,
          accessToken: null,
        }
      : undefined,
  };
}

function getSystemInfo(appVersion: string) {
  return {
    appVersion,
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    electronVersion: process.versions.electron || "unknown",
    chromeVersion: process.versions.chrome || "unknown",
    v8Version: process.versions.v8 || "unknown",
    osType: os.type(),
    osRelease: os.release(),
    osPlatform: os.platform(),
    osArch: os.arch(),
    hostname: os.hostname(),
    uptimeSeconds: Math.round(process.uptime()),
    totalMemoryMb: Math.round(os.totalmem() / 1024 / 1024),
    freeMemoryMb: Math.round(os.freemem() / 1024 / 1024),
    cpus: os.cpus().map((cpu) => ({
      model: cpu.model,
      speed: cpu.speed,
    })),
    createdAt: new Date().toISOString(),
  };
}

export function getDiagnosticsInfo(appVersion: string): DiagnosticsInfo {
  const logFiles = getLogFiles();

  return {
    ok: true,
    logsDir: getLogsDir(),
    appVersion,
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    uptime: process.uptime(),
    logFiles: {
      app: fileExists(logFiles.app),
      server: fileExists(logFiles.server),
      twitch: fileExists(logFiles.twitch),
      updates: fileExists(logFiles.updates),
      errors: fileExists(logFiles.errors),
    },
  };
}

export function createDiagnosticsArchive(options: {
  appVersion: string;
  settings: AppSettings;
  archivePath?: string;
}): DiagnosticsArchiveResult {
  try {
    ensureDiagnosticsDir();

    const timestamp = makeTimestamp();
    const archivePath =
      options.archivePath ||
      path.join(
        DIAGNOSTICS_DIR,
        `stream-chat-hub-diagnostics-${timestamp}.zip`
      );

    const zip = new AdmZip();
    const logFiles = getLogFiles();

    for (const [name, filePath] of Object.entries(logFiles)) {
      if (fileExists(filePath)) {
        zip.addLocalFile(filePath, "logs", `${name}.log`);
      }
    }

    zip.addFile(
      "settings-safe.json",
      Buffer.from(JSON.stringify(redactAuth(options.settings), null, 2), "utf-8")
    );

    zip.addFile(
      "system-info.json",
      Buffer.from(JSON.stringify(getSystemInfo(options.appVersion), null, 2), "utf-8")
    );

    zip.addFile(
      "app-version.txt",
      Buffer.from(`Stream Chat Hub ${options.appVersion}\n`, "utf-8")
    );

    zip.writeZip(archivePath);

    logger.app("Diagnostics archive created", {
      archivePath,
    });

    return {
      ok: true,
      archivePath,
    };
  } catch (error) {
    logger.error("Failed to create diagnostics archive", {
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      ok: false,
      archivePath: null,
      error:
        error instanceof Error
          ? error.message
          : "Не удалось создать архив",
    };
  }
}

export function getDiagnosticsDir() {
  ensureDiagnosticsDir();
  return DIAGNOSTICS_DIR;
}
