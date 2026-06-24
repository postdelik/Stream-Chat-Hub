import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";
import Fastify from "fastify";
import websocket from "@fastify/websocket";
import multipart from "@fastify/multipart";
import type {
  AppChatAppearanceSettings,
  AppSettings,
  ChatMessage,
  ChatSource,
  DiagnosticsArchiveResult,
  DiagnosticsClearResult,
  DiagnosticsOpenLogsResult,
  OverlayBubbleMediaType,
  OverlaySettings,
  SafeTwitchAuthState,
  SafeYouTubeAuthState,
  TwitchAuthState,
  TwitchEmoteSettings,
  UpdateCheckResult,
  UpdateInstallResult,
  UpdateSettings,
  YouTubeAuthState,
} from "../shared/types";
import { TwitchChatClient } from "./twitchChat";
import { YouTubeChatClient } from "./youtubeChat";
import { getTwitchViewersStatus } from "./twitchViewers";
import {
  createDiagnosticsArchive,
  getDiagnosticsInfo,
} from "./diagnostics";
import { clearLogFiles, getLogsDir, logger } from "./logger";
import { net, shell } from "electron";

const PORT = 3877;

const GITHUB_OWNER = "postdelik";
const GITHUB_REPO = "Stream-Chat-Hub";

const TWITCH_CLIENT_ID = "18ipdprohcqbx04oykqelu0a3h92mc";
const TWITCH_REDIRECT_URI = `http://localhost:${PORT}/twitch/auth/callback`;
const TWITCH_SCOPES = ["chat:read", "chat:edit"];

const YOUTUBE_CLIENT_ID = "ТВОЙ_GOOGLE_OAUTH_CLIENT_ID";
const YOUTUBE_REDIRECT_URI = `http://localhost:${PORT}/youtube/auth/callback`;
const YOUTUBE_SCOPES = ["https://www.googleapis.com/auth/youtube.readonly"];

const settingsDir = path.join(os.homedir(), ".stream-chat-hub");
const settingsFilePath = path.join(settingsDir, "settings.json");
const overlayAssetsDir = path.join(settingsDir, "overlay-assets");

const allowedOverlayAssetExtensions = new Set([
  ".png",
  ".webp",
  ".gif",
  ".mp4",
  ".webm",
  ".mov",
]);

const defaultUpdateSettings: UpdateSettings = {
  autoCheckEnabled: true,
  skippedVersion: "",
};

const defaultTwitchEmoteSettings: TwitchEmoteSettings = {
  sevenTvEnabled: true,
  betterTtvEnabled: true,
  frankerFaceZEnabled: true,
};

const defaultAppChatAppearance: AppChatAppearanceSettings = {
  useOverlaySettings: true,
  fontSize: 24,
  fontFamily: "Inter, Arial, sans-serif",
  messageGap: 8,
  backgroundOpacity: 65,
  backgroundColor: "#000000",
  borderRadius: 12,
  showPlatformIcon: true,
  showChannelName: true,
  showAuthorName: true,
};

const defaultOverlaySettings: OverlaySettings = {
  width: 800,
  height: 600,
  fontSize: 24,
  fontFamily: "Inter, Arial, sans-serif",
  chatWidth: 520,
  maxMessages: 12,
  position: "left",

  showPlatformIcon: true,
  showChannelName: true,
  showAuthorName: true,

  backgroundOpacity: 65,
  backgroundColor: "#000000",
  borderRadius: 12,
  messageGap: 8,

  styleMode: "messageBubble",
  showStyleInApp: false,
  bubbleMediaUrl: "",
  bubbleMediaType: "none",

  filters: {
    hideCommands: false,
    hideLinks: false,
    onlyWords: "",
    highlightWords: "",
  },
};

const defaultTwitchAuth: TwitchAuthState = {
  enabled: false,
  username: null,
  accessToken: null,
  scopes: [],
  expiresAt: null,
};

const defaultYouTubeAuth: YouTubeAuthState = {
  enabled: false,
  accessToken: null,
  refreshToken: null,
  scopes: [],
  expiresAt: null,
};

const defaultSettings: AppSettings = {
  sources: [],
  youtubeApiKey: "",
  overlay: defaultOverlaySettings,
  updates: defaultUpdateSettings,
  twitchEmotes: defaultTwitchEmoteSettings,
  onboarding: {
    initialChoiceMade: false,
    onboardingVersion: "",
    lastLaunchedVersion: "",
  },
  appChatAppearance: defaultAppChatAppearance,
  twitchAuth: defaultTwitchAuth,
  youtubeAuth: defaultYouTubeAuth,
};

type LocalServerOptions = {
  currentVersion?: string;
  appPath?: string;
  isPackaged?: boolean;
  quitApp?: () => void;
};

let currentAppVersion = "0.0.0";
let currentAppPath = "";
let currentIsPackaged = false;
let quitAppCallback: (() => void) | null = null;
let cachedUpdateCheck: UpdateCheckResult | null = null;

let appSettings = loadSettings();
let messages: ChatMessage[] = [];
let mockTimer: NodeJS.Timeout | null = null;
let mockRunning = false;

const appSockets = new Set<any>();
const overlaySockets = new Set<any>();

const twitchChatClient = new TwitchChatClient(
  (message) => pushMessage(message),
  TWITCH_CLIENT_ID
);
const youtubeChatClient = new YouTubeChatClient((message) => pushMessage(message));

function createMessageId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function ensureSettingsDir() {
  if (!fs.existsSync(settingsDir)) {
    fs.mkdirSync(settingsDir, { recursive: true });
  }
}

function ensureOverlayAssetsDir() {
  if (!fs.existsSync(overlayAssetsDir)) {
    fs.mkdirSync(overlayAssetsDir, { recursive: true });
  }
}

function getOverlayMediaType(fileName: string): OverlayBubbleMediaType {
  const ext = path.extname(fileName).toLowerCase();

  if (ext === ".png" || ext === ".webp" || ext === ".gif") {
    return "image";
  }

  if (ext === ".mp4" || ext === ".webm" || ext === ".mov") {
    return "video";
  }

  return "none";
}

function getContentType(fileName: string) {
  const ext = path.extname(fileName).toLowerCase();

  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  if (ext === ".mp4") return "video/mp4";
  if (ext === ".webm") return "video/webm";
  if (ext === ".mov") return "video/quicktime";

  return "application/octet-stream";
}

function normalizeVersion(version: string) {
  return version.trim().replace(/^v/i, "");
}

function compareVersions(currentVersion: string, latestVersion: string) {
  const currentParts = normalizeVersion(currentVersion)
    .split(".")
    .map((part) => Number.parseInt(part, 10) || 0);

  const latestParts = normalizeVersion(latestVersion)
    .split(".")
    .map((part) => Number.parseInt(part, 10) || 0);

  const maxLength = Math.max(currentParts.length, latestParts.length);

  for (let index = 0; index < maxLength; index += 1) {
    const currentPart = currentParts[index] || 0;
    const latestPart = latestParts[index] || 0;

    if (latestPart > currentPart) return 1;
    if (latestPart < currentPart) return -1;
  }

  return 0;
}

function findBestReleaseAsset(
  assets: Array<{
    name?: string;
    browser_download_url?: string;
  }>
) {
  const portableAsset = assets.find((asset) => {
    const name = asset.name?.toLowerCase() || "";

    return (
      name.endsWith(".exe") &&
      (name.includes("portable") ||
        name.includes("stream chat hub") ||
        name.includes("stream-chat-hub"))
    );
  });

  if (portableAsset?.browser_download_url) {
    return portableAsset.browser_download_url;
  }

  const exeAsset = assets.find((asset) => {
    const name = asset.name?.toLowerCase() || "";
    return name.endsWith(".exe");
  });

  return exeAsset?.browser_download_url || null;
}

async function checkForUpdates(force = false): Promise<UpdateCheckResult> {
  const now = Date.now();

  logger.updates("Checking for updates", {
    force,
    currentAppVersion,
  });

  if (
    !force &&
    cachedUpdateCheck &&
    now - cachedUpdateCheck.checkedAt < 10 * 60 * 1000
  ) {
    return cachedUpdateCheck;
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "Stream-Chat-Hub",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub returned ${response.status}`);
    }

    const release = (await response.json()) as {
      tag_name?: string;
      html_url?: string;
      body?: string;
      assets?: Array<{
        name?: string;
        browser_download_url?: string;
      }>;
    };

    const latestVersion = release.tag_name
      ? normalizeVersion(release.tag_name)
      : null;

    const updateAvailable = latestVersion
      ? compareVersions(currentAppVersion, latestVersion) > 0
      : false;

    const result: UpdateCheckResult = {
      ok: true,
      currentVersion: currentAppVersion,
      latestVersion,
      updateAvailable,
      releaseUrl: release.html_url || null,
      downloadUrl: findBestReleaseAsset(release.assets || []),
      releaseNotes: release.body || "",
      checkedAt: now,
    };

    logger.updates("Update check completed", {
      currentVersion: result.currentVersion,
      latestVersion: result.latestVersion,
      updateAvailable: result.updateAvailable,
      downloadUrl: result.downloadUrl,
    });

    cachedUpdateCheck = result;
    return result;
  } catch (error) {
    const result: UpdateCheckResult = {
      ok: false,
      currentVersion: currentAppVersion,
      latestVersion: null,
      updateAvailable: false,
      releaseUrl: null,
      downloadUrl: null,
      releaseNotes: "",
      checkedAt: now,
      error:
        error instanceof Error
          ? error.message
          : "Не удалось проверить обновления",
    };

    logger.error("Update check failed", {
      error: result.error,
    });

    cachedUpdateCheck = result;
    return result;
  }
}

async function downloadFile(url: string, targetPath: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Stream-Chat-Hub",
    },
  });

  if (!response.ok) {
    throw new Error(`Download failed: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  fs.writeFileSync(targetPath, Buffer.from(arrayBuffer));
}

function escapeCmdPath(value: string) {
  return value.replaceAll('"', '\\"');
}

function createPortableUpdateScript(options: {
  currentExePath: string;
  newExePath: string;
  currentPid: number;
}) {
  const scriptPath = path.join(
    os.tmpdir(),
    `stream-chat-hub-update-${Date.now()}.cmd`
  );

  const currentExePath = escapeCmdPath(options.currentExePath);
  const newExePath = escapeCmdPath(options.newExePath);
  const currentPid = options.currentPid;

  const script = [
    "@echo off",
    "setlocal",
    `set CURRENT_PID=${currentPid}`,
    `set CURRENT_EXE="${currentExePath}"`,
    `set NEW_EXE="${newExePath}"`,
    "",
    ":wait",
    'tasklist /FI "PID eq %CURRENT_PID%" | find "%CURRENT_PID%" > nul',
    "if not errorlevel 1 (",
    "  timeout /t 1 /nobreak > nul",
    "  goto wait",
    ")",
    "",
    "timeout /t 1 /nobreak > nul",
    "copy /Y %NEW_EXE% %CURRENT_EXE%",
    "start \"\" %CURRENT_EXE%",
    "del %NEW_EXE%",
    "del \"%~f0\"",
    "endlocal",
    "",
  ].join("\r\n");

  fs.writeFileSync(scriptPath, script, "utf-8");

  return scriptPath;
}

async function installPortableUpdate(downloadUrl: string): Promise<UpdateInstallResult> {
  try {
    logger.updates("Starting portable update install", {
      downloadUrl,
      currentAppPath,
    });

    if (!currentIsPackaged) {
      return {
        ok: false,
        error: "Обновление доступно только в собранной версии приложения",
      };
    }

    if (process.platform !== "win32") {
      return {
        ok: false,
        error: "Автообновление portable пока доступно только на Windows",
      };
    }

    if (!currentAppPath || !fs.existsSync(currentAppPath)) {
      return {
        ok: false,
        error: "Не удалось определить путь текущего приложения",
      };
    }

    const tempDir = path.join(os.tmpdir(), "stream-chat-hub-updates");

    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const downloadedExePath = path.join(tempDir, "Stream Chat Hub.new.exe");

    await downloadFile(downloadUrl, downloadedExePath);

    logger.updates("Update downloaded", {
      downloadedExePath,
    });

    const scriptPath = createPortableUpdateScript({
      currentExePath: currentAppPath,
      newExePath: downloadedExePath,
      currentPid: process.pid,
    });

    logger.updates("Update script created", {
      scriptPath,
    });

    spawn("cmd.exe", ["/c", scriptPath], {
      detached: true,
      stdio: "ignore",
      windowsHide: true,
    }).unref();

    setTimeout(() => {
      if (quitAppCallback) {
        quitAppCallback();
      } else {
        process.exit(0);
      }
    }, 300);

    return {
      ok: true,
    };
  } catch (error) {
    logger.error("Portable update install failed", {
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Не удалось установить обновление",
    };
  }
}

function loadSettings(): AppSettings {
  try {
    ensureSettingsDir();

    if (!fs.existsSync(settingsFilePath)) {
      saveSettings(defaultSettings);
      return defaultSettings;
    }

    const raw = fs.readFileSync(settingsFilePath, "utf-8");
    const parsed = JSON.parse(raw) as Partial<AppSettings>;

    return normalizeSettings(parsed);
  } catch {
    return defaultSettings;
  }
}

function saveSettings(settings: AppSettings) {
  ensureSettingsDir();
  fs.writeFileSync(
    settingsFilePath,
    JSON.stringify(normalizeSettings(settings), null, 2),
    "utf-8"
  );
}

function normalizeSettings(settings: Partial<AppSettings>): AppSettings {
  return {
    sources: Array.isArray(settings.sources) ? settings.sources : [],
    youtubeApiKey:
      typeof settings.youtubeApiKey === "string" ? settings.youtubeApiKey : "",
    overlay: {
      ...defaultOverlaySettings,
      ...(settings.overlay || {}),
      fontFamily: settings.overlay?.fontFamily || defaultOverlaySettings.fontFamily,
      backgroundColor:
        typeof settings.overlay?.backgroundColor === "string"
          ? settings.overlay.backgroundColor
          : defaultOverlaySettings.backgroundColor,
      styleMode: settings.overlay?.styleMode || "messageBubble",
      showStyleInApp: Boolean(settings.overlay?.showStyleInApp),
      bubbleMediaUrl: settings.overlay?.bubbleMediaUrl || "",
      bubbleMediaType: settings.overlay?.bubbleMediaType || "none",
      filters: {
        ...defaultOverlaySettings.filters,
        ...(settings.overlay?.filters || {}),
      },
    },
    updates: {
      ...defaultUpdateSettings,
      ...(settings.updates || {}),
      autoCheckEnabled:
        typeof settings.updates?.autoCheckEnabled === "boolean"
          ? settings.updates.autoCheckEnabled
          : defaultUpdateSettings.autoCheckEnabled,
      skippedVersion:
        typeof settings.updates?.skippedVersion === "string"
          ? settings.updates.skippedVersion
          : defaultUpdateSettings.skippedVersion,
    },
    twitchEmotes: {
      sevenTvEnabled:
        typeof settings.twitchEmotes?.sevenTvEnabled === "boolean"
          ? settings.twitchEmotes.sevenTvEnabled
          : defaultTwitchEmoteSettings.sevenTvEnabled,
      betterTtvEnabled:
        typeof settings.twitchEmotes?.betterTtvEnabled === "boolean"
          ? settings.twitchEmotes.betterTtvEnabled
          : defaultTwitchEmoteSettings.betterTtvEnabled,
      frankerFaceZEnabled:
        typeof settings.twitchEmotes?.frankerFaceZEnabled === "boolean"
          ? settings.twitchEmotes.frankerFaceZEnabled
          : defaultTwitchEmoteSettings.frankerFaceZEnabled,
    },
    onboarding: {
      initialChoiceMade:
        typeof settings.onboarding?.initialChoiceMade === "boolean"
          ? settings.onboarding.initialChoiceMade
          : false,
      onboardingVersion:
        typeof settings.onboarding?.onboardingVersion === "string"
          ? settings.onboarding.onboardingVersion
          : "",
      lastLaunchedVersion:
        typeof settings.onboarding?.lastLaunchedVersion === "string"
          ? settings.onboarding.lastLaunchedVersion
          : "",
    },
    appChatAppearance: {
      useOverlaySettings:
        typeof settings.appChatAppearance?.useOverlaySettings === "boolean"
          ? settings.appChatAppearance.useOverlaySettings
          : defaultAppChatAppearance.useOverlaySettings,
      fontSize:
        typeof settings.appChatAppearance?.fontSize === "number"
          ? Math.min(120, Math.max(10, settings.appChatAppearance.fontSize))
          : defaultAppChatAppearance.fontSize,
      fontFamily:
        typeof settings.appChatAppearance?.fontFamily === "string"
          ? settings.appChatAppearance.fontFamily
          : defaultAppChatAppearance.fontFamily,
      messageGap:
        typeof settings.appChatAppearance?.messageGap === "number"
          ? Math.min(40, Math.max(0, settings.appChatAppearance.messageGap))
          : defaultAppChatAppearance.messageGap,
      backgroundOpacity:
        typeof settings.appChatAppearance?.backgroundOpacity === "number"
          ? Math.min(
              100,
              Math.max(0, settings.appChatAppearance.backgroundOpacity)
            )
          : defaultAppChatAppearance.backgroundOpacity,
      backgroundColor:
        typeof settings.appChatAppearance?.backgroundColor === "string"
          ? settings.appChatAppearance.backgroundColor
          : defaultAppChatAppearance.backgroundColor,
      borderRadius:
        typeof settings.appChatAppearance?.borderRadius === "number"
          ? Math.min(60, Math.max(0, settings.appChatAppearance.borderRadius))
          : defaultAppChatAppearance.borderRadius,
      showPlatformIcon:
        typeof settings.appChatAppearance?.showPlatformIcon === "boolean"
          ? settings.appChatAppearance.showPlatformIcon
          : defaultAppChatAppearance.showPlatformIcon,
      showChannelName:
        typeof settings.appChatAppearance?.showChannelName === "boolean"
          ? settings.appChatAppearance.showChannelName
          : defaultAppChatAppearance.showChannelName,
      showAuthorName:
        typeof settings.appChatAppearance?.showAuthorName === "boolean"
          ? settings.appChatAppearance.showAuthorName
          : defaultAppChatAppearance.showAuthorName,
    },
    twitchAuth: {
      ...defaultTwitchAuth,
      ...(settings.twitchAuth || {}),
    },
    youtubeAuth: {
      ...defaultYouTubeAuth,
      ...(settings.youtubeAuth || {}),
    },
  };
}

function getSafeSettings(settings: AppSettings): AppSettings {
  return {
    ...settings,
    twitchAuth: {
      enabled: Boolean(settings.twitchAuth?.enabled),
      username: settings.twitchAuth?.username ?? null,
      accessToken: null,
      scopes: settings.twitchAuth?.scopes ?? [],
      expiresAt: settings.twitchAuth?.expiresAt ?? null,
    },
    youtubeAuth: {
      enabled: Boolean(settings.youtubeAuth?.enabled),
      accessToken: null,
      refreshToken: null,
      scopes: settings.youtubeAuth?.scopes ?? [],
      expiresAt: settings.youtubeAuth?.expiresAt ?? null,
    },
  };
}

function getSafeTwitchAuthState(): SafeTwitchAuthState {
  const auth = appSettings.twitchAuth || defaultTwitchAuth;

  return {
    enabled: Boolean(auth.enabled),
    username: auth.username,
    scopes: auth.scopes,
    expiresAt: auth.expiresAt,
    hasToken: Boolean(auth.accessToken),
  };
}

function getSafeYouTubeAuthState(): SafeYouTubeAuthState {
  const auth = appSettings.youtubeAuth || defaultYouTubeAuth;

  return {
    enabled: Boolean(auth.enabled),
    scopes: auth.scopes,
    expiresAt: auth.expiresAt,
    hasAccessToken: Boolean(auth.accessToken),
    hasRefreshToken: Boolean(auth.refreshToken),
    configured:
      Boolean(YOUTUBE_CLIENT_ID) &&
      YOUTUBE_CLIENT_ID !== "ТВОЙ_GOOGLE_OAUTH_CLIENT_ID",
  };
}

function normalizeTwitchChannelName(channelName: string) {
  return channelName.trim().replace(/^#/, "").replace(/^@/, "").toLowerCase();
}

function getEnabledTwitchChannelNames(sources: ChatSource[]) {
  return sources
    .filter((source) => source.enabled && source.platform === "twitch")
    .map((source) => normalizeTwitchChannelName(source.channelName))
    .filter(Boolean);
}


const allowedEmoteProxyHosts = new Set([
  "cdn.betterttv.net",
  "cdn.7tv.app",
  "cdn.frankerfacez.com",
  "static-cdn.jtvnw.net",
]);

function buildEmoteProxyUrl(url: string) {
  try {
    const parsedUrl = new URL(url);

    if (
      parsedUrl.protocol !== "https:" ||
      !allowedEmoteProxyHosts.has(parsedUrl.hostname.toLowerCase())
    ) {
      return url;
    }

    return `http://127.0.0.1:${PORT}/emotes/proxy?url=${encodeURIComponent(url)}`;
  } catch {
    return url;
  }
}

function prepareMessageForDelivery(message: ChatMessage): ChatMessage {
  if (!message.emotes?.length) {
    return message;
  }

  return {
    ...message,
    emotes: message.emotes.map((emote) => ({
      ...emote,
      url:
        emote.platform === "thirdParty"
          ? buildEmoteProxyUrl(emote.url)
          : emote.url,
    })),
  };
}

function pushMessage(message: ChatMessage) {
  const preparedMessage = prepareMessageForDelivery(message);

  messages.push(preparedMessage);
  messages = messages.slice(-300);

  const payload = JSON.stringify(preparedMessage);

  for (const socket of appSockets) {
    try {
      socket.send(payload);
    } catch {
      appSockets.delete(socket);
    }
  }

  for (const socket of overlaySockets) {
    try {
      socket.send(payload);
    } catch {
      overlaySockets.delete(socket);
    }
  }
}

function clearMessages() {
  messages = [];
}

function startMockMessages() {
  if (mockTimer) return;

  mockRunning = true;

  const mockAuthors = ["PixelFox", "StreamGoblin", "ChatWizard", "DanilaBot"];
  const mockTexts = [
    "Тестовое сообщение для OBS",
    "Проверяем размер шрифта",
    "А вот и длинное сообщение, чтобы проверить перенос строк в overlay",
    "!команда для проверки фильтра",
    "Вопрос: как дела у чата?",
    "https://example.com проверка ссылок",
  ];

  mockTimer = setInterval(() => {
    const authorName =
      mockAuthors[Math.floor(Math.random() * mockAuthors.length)];
    const text = mockTexts[Math.floor(Math.random() * mockTexts.length)];

    pushMessage({
      id: createMessageId(),
      platform: "mock",
      channelName: "test-overlay",
      authorName,
      text,
      timestamp: Date.now(),
    });
  }, 1800);
}

function stopMockMessages() {
  if (mockTimer) {
    clearInterval(mockTimer);
    mockTimer = null;
  }

  mockRunning = false;
}

function getMockStatus() {
  return { running: mockRunning };
}

function makeOverlayHtml() {
  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <title>Stream Chat Hub Overlay</title>
  <style>
    * { box-sizing: border-box; }

    html,
    body {
      margin: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: transparent;
      font-family: Inter, Arial, sans-serif;
    }

    body {
      display: flex;
      align-items: flex-end;
      justify-content: flex-start;
    }

    #root {
      width: 100vw;
      height: 100vh;
      display: flex;
      align-items: flex-end;
      justify-content: flex-start;
      padding: 24px;
    }

    #chat {
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      align-items: stretch;
      gap: 8px;
      max-height: 100%;
      overflow: hidden;
    }

    .message {
      display: block;
      width: 100%;
      color: #ffffff;
      line-height: 1.35;
      text-align: left;
      word-break: break-word;
      overflow-wrap: anywhere;
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.75);
    }

    .messageInner {
      position: relative;
      display: inline-block;
      max-width: 100%;
      overflow: hidden;
      padding: 10px 12px;
    }

    .bubbleMedia {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      z-index: 0;
      pointer-events: none;
    }

    .bubbleContent {
      position: relative;
      z-index: 1;
    }

    .meta {
      display: inline;
      font-weight: 800;
    }

    .platform,
    .channel,
    .author {
      margin-right: 6px;
    }

    .channel {
      color: #c4b5fd;
    }

    .author {
      color: #ffffff;
    }

    .text {
      font-weight: 650;
    }

    .highlight {
      padding: 0 4px;
      border-radius: 5px;
      color: #111827;
      background: #fde68a;
      font-weight: 950;
    }
    .emote {
     display: inline-block;
     width: auto;
     height: 1.45em;
     min-height: 24px;
     max-height: 42px;
     margin: 0 2px;
     vertical-align: middle;
     object-fit: contain;
}
  </style>
</head>
<body>
  <div id="root">
    <div id="chat"></div>
  </div>

  <script>
    const root = document.getElementById("root");
    const chat = document.getElementById("chat");

    let settings = null;
    let messages = [];

    function escapeHtml(value) {
      return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }

    function escapeAttr(value) {
      return escapeHtml(value).replaceAll("\\n", "");
    }

    function hexToRgb(hex) {
      const clean = String(hex || "#000000").replace("#", "");

      if (!/^[0-9a-fA-F]{6}$/.test(clean)) {
        return "0, 0, 0";
      }

      const r = parseInt(clean.slice(0, 2), 16);
      const g = parseInt(clean.slice(2, 4), 16);
      const b = parseInt(clean.slice(4, 6), 16);

      return r + ", " + g + ", " + b;
    }

    function getPlatformIcon(platform) {
      if (platform === "twitch") return "🟣";
      if (platform === "youtube") return "🔴";
      return "⚪";
    }

    function parseCommaWords(value) {
      return String(value || "")
        .split(",")
        .map((word) => word.trim().toLowerCase())
        .filter(Boolean);
    }

    function messagePassesFilters(message) {
      const filters = settings.overlay.filters;

      if (filters.hideCommands && message.text.trim().startsWith("!")) {
        return false;
      }

      if (filters.hideLinks && /https?:\\/\\/|www\\./i.test(message.text)) {
        return false;
      }

      const onlyWords = parseCommaWords(filters.onlyWords);

      if (onlyWords.length > 0) {
        const lowerText = message.text.toLowerCase();
        return onlyWords.some((word) => lowerText.includes(word));
      }

      return true;
    }

    function highlightText(text) {
      const words = parseCommaWords(settings.overlay.filters.highlightWords);

      if (words.length === 0) {
        return escapeHtml(text);
      }

      let result = escapeHtml(text);

      for (const word of words) {
        const escapedWord = word.replace(/[-\\/\\\\^$*+?.()|[\\]{}]/g, "\\\\$&");
        const regex = new RegExp("(" + escapedWord + ")", "gi");
        result = result.replace(regex, '<span class="highlight">$1</span>');
      }

      return result;
    }
function renderTextWithEmotes(text, emotes) {
  const validEmotes = Array.isArray(emotes)
    ? emotes
        .filter((emote) => {
          return (
            Number.isFinite(emote.start) &&
            Number.isFinite(emote.end) &&
            emote.start >= 0 &&
            emote.end >= emote.start &&
            emote.end < text.length &&
            emote.url
          );
        })
        .sort((a, b) => a.start - b.start)
    : [];

  if (validEmotes.length === 0) {
    return highlightText(text);
  }

  let result = "";
  let cursor = 0;

  for (const emote of validEmotes) {
    if (emote.start < cursor) {
      continue;
    }

    const beforeText = text.slice(cursor, emote.start);

    if (beforeText) {
      result += highlightText(beforeText);
    }

    result +=
      '<img class="emote" src="' +
      escapeAttr(emote.url) +
      '" alt="' +
      escapeAttr(emote.name || "emote") +
      '" title="' +
      escapeAttr(emote.name || "emote") +
      '" onerror="this.replaceWith(document.createTextNode(this.alt))" />';

    cursor = emote.end + 1;
  }

  const restText = text.slice(cursor);

  if (restText) {
    result += highlightText(restText);
  }

  return result;
}
    function createBubbleMedia() {
      const overlay = settings.overlay;

      if (!overlay.bubbleMediaUrl || overlay.bubbleMediaType === "none") {
        return "";
      }

      const url = escapeAttr(overlay.bubbleMediaUrl);

      if (overlay.bubbleMediaType === "video") {
        return '<video class="bubbleMedia" src="' + url + '" autoplay muted loop playsinline></video>';
      }

      return '<img class="bubbleMedia" src="' + url + '" alt="" />';
    }

    function applySettings() {
      const overlay = settings.overlay;
      const opacity = Math.max(0, Math.min(100, overlay.backgroundOpacity)) / 100;
      const rgb = hexToRgb(overlay.backgroundColor || "#000000");

      document.body.style.width = overlay.width + "px";
      document.body.style.height = overlay.height + "px";
      document.body.style.fontFamily = overlay.fontFamily || "Inter, Arial, sans-serif";

      root.style.width = overlay.width + "px";
      root.style.height = overlay.height + "px";

      if (overlay.position === "left") {
        root.style.justifyContent = "flex-start";
      } else if (overlay.position === "right") {
        root.style.justifyContent = "flex-end";
      } else {
        root.style.justifyContent = "center";
      }

      chat.style.width = overlay.chatWidth + "px";
      chat.style.gap = overlay.messageGap + "px";
      chat.style.fontSize = overlay.fontSize + "px";
      chat.style.fontFamily = overlay.fontFamily || "Inter, Arial, sans-serif";

      if (overlay.styleMode === "containerBubble") {
        chat.style.background = "rgba(" + rgb + ", " + opacity + ")";
        chat.style.borderRadius = overlay.borderRadius + "px";
        chat.style.padding = "12px";
      } else {
        chat.style.background = "transparent";
        chat.style.borderRadius = "0";
        chat.style.padding = "0";
      }
    }

    function render() {
      if (!settings) return;

      applySettings();

      const overlay = settings.overlay;
      const opacity = Math.max(0, Math.min(100, overlay.backgroundOpacity)) / 100;
      const rgb = hexToRgb(overlay.backgroundColor || "#000000");

      const visibleMessages = messages
        .filter(messagePassesFilters)
        .slice(-overlay.maxMessages);

      const containerMedia =
        overlay.styleMode === "containerBubble" ? createBubbleMedia() : "";

      const messagesHtml = visibleMessages
        .map((message) => {
          const parts = [];

          if (overlay.showPlatformIcon) {
            parts.push('<span class="platform">' + getPlatformIcon(message.platform) + '</span>');
          }

          if (overlay.showChannelName) {
            parts.push('<span class="channel">#' + escapeHtml(message.channelName) + '</span>');
          }

          if (overlay.showAuthorName) {
            parts.push('<span class="author">' + escapeHtml(message.authorName) + ':</span>');
          }

          let messageBackground = "transparent";
          let messageRadius = 0;
          let media = "";

          if (overlay.styleMode === "color" || overlay.styleMode === "messageBubble") {
            messageBackground = "rgba(" + rgb + ", " + opacity + ")";
            messageRadius = overlay.borderRadius;
          }

          if (overlay.styleMode === "messageBubble") {
            media = createBubbleMedia();
          }

          return [
            '<div class="message">',
              '<div class="messageInner" style="background: ' + messageBackground + '; border-radius: ' + messageRadius + 'px;">',
                media,
                '<div class="bubbleContent">',
                  '<span class="meta">',
                    parts.join(""),
                  '</span>',
                  '<span class="text">' + renderTextWithEmotes(message.text, message.emotes) + '</span>',
                '</div>',
              '</div>',
            '</div>'
          ].join("");
        })
        .join("");

      chat.innerHTML = containerMedia + messagesHtml;
    }

    async function loadSettings() {
      const response = await fetch("/settings");
      settings = await response.json();
      render();
    }

    async function loadMessages() {
      const response = await fetch("/messages");
      messages = await response.json();
      render();
    }

    function connectSocket() {
      const socket = new WebSocket("ws://localhost:${PORT}/overlay/ws");

      socket.addEventListener("message", (event) => {
        const message = JSON.parse(event.data);
        messages.push(message);
        messages = messages.slice(-300);
        render();
      });

      socket.addEventListener("close", () => {
        setTimeout(connectSocket, 1000);
      });
    }

    loadSettings();
    loadMessages();
    connectSocket();

    setInterval(loadSettings, 1000);
    setInterval(loadMessages, 1000);
  </script>
</body>
</html>`;
}

function makeTwitchCallbackHtml() {
  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <title>Twitch Login</title>
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: #0f0f1a;
      color: white;
      font-family: Arial, sans-serif;
    }

    .card {
      width: min(520px, calc(100vw - 32px));
      padding: 24px;
      border-radius: 20px;
      background: rgba(255,255,255,0.08);
      text-align: center;
    }

    .ok { color: #bbf7d0; }
    .error { color: #fecaca; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Stream Chat Hub</h1>
    <p id="status">Забираю токен Twitch...</p>
  </div>

  <script>
    const status = document.getElementById("status");

    async function finishAuth() {
      try {
        const hash = new URLSearchParams(window.location.hash.slice(1));
        const accessToken = hash.get("access_token");
        const scope = hash.get("scope") || "";
        const error = hash.get("error");
        const errorDescription = hash.get("error_description");

        if (error) {
          status.className = "error";
          status.textContent = errorDescription || error;
          return;
        }

        if (!accessToken) {
          status.className = "error";
          status.textContent = "Twitch не вернул access token";
          return;
        }

        const response = await fetch("/twitch/auth/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accessToken,
            scopes: scope.split(" ").filter(Boolean),
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.ok) {
          status.className = "error";
          status.textContent = data.error || "Не удалось сохранить Twitch-вход";
          return;
        }

        status.className = "ok";
        status.textContent = "Готово. Можно закрыть это окно.";

        setTimeout(() => {
          window.close();
        }, 1200);
      } catch {
        status.className = "error";
        status.textContent = "Ошибка Twitch-входа";
      }
    }

    finishAuth();
  </script>
</body>
</html>`;
}

function makeYouTubeCallbackHtml(success: boolean, message: string) {
  return `<!doctype html><html><body>${success ? "OK" : "ERROR"}: ${message}</body></html>`;
}

async function validateTwitchToken(accessToken: string) {
  const response = await fetch("https://id.twitch.tv/oauth2/validate", {
    headers: {
      Authorization: `OAuth ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Twitch token invalid");
  }

  return (await response.json()) as {
    client_id: string;
    login: string;
    scopes: string[];
    expires_in: number;
  };
}

function buildTwitchAuthUrl() {
  const params = new URLSearchParams({
    client_id: TWITCH_CLIENT_ID,
    redirect_uri: TWITCH_REDIRECT_URI,
    response_type: "token",
    scope: TWITCH_SCOPES.join(" "),
    force_verify: "true",
  });

  return `https://id.twitch.tv/oauth2/authorize?${params.toString()}`;
}

function buildYouTubeAuthUrl() {
  const params = new URLSearchParams({
    client_id: YOUTUBE_CLIENT_ID,
    redirect_uri: YOUTUBE_REDIRECT_URI,
    response_type: "code",
    scope: YOUTUBE_SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

async function exchangeYouTubeCode(code: string) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: YOUTUBE_CLIENT_ID,
      code,
      grant_type: "authorization_code",
      redirect_uri: YOUTUBE_REDIRECT_URI,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`YouTube token exchange failed: ${text}`);
  }

  return (await response.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    scope?: string;
    token_type: string;
  };
}

async function refreshYouTubeToken(auth: YouTubeAuthState) {
  if (!auth.refreshToken) return auth;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: YOUTUBE_CLIENT_ID,
      refresh_token: auth.refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) return auth;

  const data = (await response.json()) as {
    access_token: string;
    expires_in: number;
    scope?: string;
    token_type: string;
  };

  const nextAuth: YouTubeAuthState = {
    ...auth,
    enabled: true,
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
    scopes: data.scope ? data.scope.split(" ") : auth.scopes,
  };

  appSettings.youtubeAuth = nextAuth;
  saveSettings(appSettings);

  return nextAuth;
}

async function getUsableYouTubeAuth() {
  const auth = appSettings.youtubeAuth || defaultYouTubeAuth;

  if (!auth.enabled || !auth.accessToken) return auth;

  const expiresAt = auth.expiresAt || 0;
  const shouldRefresh = expiresAt - Date.now() < 60_000;

  if (!shouldRefresh) return auth;

  return refreshYouTubeToken(auth);
}

export async function startLocalServer(options?: LocalServerOptions) {
  currentAppVersion = options?.currentVersion || currentAppVersion;
  currentAppPath = options?.appPath || currentAppPath;
  currentIsPackaged = Boolean(options?.isPackaged);
  quitAppCallback = options?.quitApp || null;

  logger.server("Starting local server", {
    currentAppVersion,
    currentAppPath,
    currentIsPackaged,
  });

  const server = Fastify({ logger: false });

  await server.register(websocket);
  await server.register(multipart);

  server.addHook("onRequest", async (_request, reply) => {
    reply.header("Access-Control-Allow-Origin", "*");
    reply.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    reply.header("Access-Control-Allow-Headers", "Content-Type");
  });

  server.options("*", async (_request, reply) => {
    reply.send();
  });

  server.get("/diagnostics/info", async () => {
    return getDiagnosticsInfo(currentAppVersion);
  });

  server.post("/diagnostics/archive", async () => {
    return createDiagnosticsArchive({
      appVersion: currentAppVersion,
      settings: appSettings,
    }) satisfies DiagnosticsArchiveResult;
  });

  server.post("/diagnostics/open-logs", async () => {
    try {
      const logsDir = getLogsDir();
      await shell.openPath(logsDir);

      logger.app("Logs folder opened", {
        logsDir,
      });

      return {
        ok: true,
        logsDir,
      } satisfies DiagnosticsOpenLogsResult;
    } catch (error) {
      logger.error("Failed to open logs folder", {
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        ok: false,
        logsDir: getLogsDir(),
        error:
          error instanceof Error
            ? error.message
            : "Не удалось открыть папку логов",
      } satisfies DiagnosticsOpenLogsResult;
    }
  });

  server.post("/diagnostics/clear-logs", async () => {
    try {
      clearLogFiles();

      return {
        ok: true,
      } satisfies DiagnosticsClearResult;
    } catch (error) {
      logger.error("Failed to clear logs", {
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        ok: false,
        error:
          error instanceof Error ? error.message : "Не удалось очистить логи",
      } satisfies DiagnosticsClearResult;
    }
  });

  server.get("/updates/check", async (request) => {
    const query = request.query as {
      force?: string;
    };

    return checkForUpdates(query.force === "true");
  });

  server.get("/updates/settings", async () => {
    return appSettings.updates || defaultUpdateSettings;
  });

  server.post("/updates/settings", async (request) => {
    const body = request.body as Partial<UpdateSettings>;

    appSettings.updates = {
      ...defaultUpdateSettings,
      ...(appSettings.updates || {}),
      ...(body || {}),
      autoCheckEnabled:
        typeof body.autoCheckEnabled === "boolean"
          ? body.autoCheckEnabled
          : appSettings.updates?.autoCheckEnabled ??
            defaultUpdateSettings.autoCheckEnabled,
      skippedVersion:
        typeof body.skippedVersion === "string"
          ? body.skippedVersion
          : appSettings.updates?.skippedVersion ??
            defaultUpdateSettings.skippedVersion,
    };

    saveSettings(appSettings);

    return {
      ok: true,
      updates: appSettings.updates,
    };
  });

  server.post("/updates/install", async (request) => {
    const body = request.body as {
      downloadUrl?: string;
    };

    const downloadUrl = body.downloadUrl || cachedUpdateCheck?.downloadUrl;

    if (!downloadUrl) {
      return {
        ok: false,
        error: "Нет ссылки для скачивания обновления",
      } satisfies UpdateInstallResult;
    }

    return installPortableUpdate(downloadUrl);
  });


  server.get("/emotes/proxy", async (request, reply) => {
    const query = request.query as { url?: string };
    const rawUrl = String(query.url || "").trim();

    if (!rawUrl) {
      reply.code(400).send({ ok: false, error: "Не указан URL эмоутa" });
      return;
    }

    let parsedUrl: URL;

    try {
      parsedUrl = new URL(rawUrl);
    } catch {
      reply.code(400).send({ ok: false, error: "Некорректный URL эмоутa" });
      return;
    }

    const hostname = parsedUrl.hostname.toLowerCase();

    if (
      parsedUrl.protocol !== "https:" ||
      !allowedEmoteProxyHosts.has(hostname)
    ) {
      reply.code(403).send({ ok: false, error: "Источник эмоутa запрещён" });
      return;
    }

    try {
      const response = await net.fetch(parsedUrl.toString(), {
        headers: {
          Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
          "User-Agent": "Stream-Chat-Hub",
        },
        bypassCustomProtocolHandlers: false,
      });

      if (!response.ok) {
        reply.code(response.status).send({
          ok: false,
          error: `CDN вернул статус ${response.status}`,
        });
        return;
      }

      const contentType =
        response.headers.get("content-type") || "application/octet-stream";
      const buffer = Buffer.from(await response.arrayBuffer());

      reply
        .header("Cache-Control", "public, max-age=86400")
        .type(contentType)
        .send(buffer);
    } catch (error) {
      logger.error("Failed to proxy emote", {
        url: parsedUrl.toString(),
        error: error instanceof Error ? error.message : String(error),
      });

      reply.code(502).send({
        ok: false,
        error: "Не удалось загрузить эмоут",
      });
    }
  });

  server.get("/overlay-assets/:fileName", async (request, reply) => {
    const params = request.params as { fileName: string };
    const safeFileName = path.basename(params.fileName);
    const filePath = path.join(overlayAssetsDir, safeFileName);

    if (!fs.existsSync(filePath)) {
      reply.code(404).send({ ok: false, error: "Файл не найден" });
      return;
    }

    reply.type(getContentType(safeFileName)).send(fs.readFileSync(filePath));
  });

  server.post("/overlay-assets/upload", async (request, reply) => {
    try {
      ensureOverlayAssetsDir();

      const file = await request.file();

      if (!file) {
        reply.code(400).send({
          ok: false,
          url: "",
          mediaType: "none",
          error: "Файл не выбран",
        });
        return;
      }

      const originalName = file.filename || "overlay-asset";
      const ext = path.extname(originalName).toLowerCase();

      if (!allowedOverlayAssetExtensions.has(ext)) {
        reply.code(400).send({
          ok: false,
          url: "",
          mediaType: "none",
          error: "Поддерживаются PNG, WebP, GIF, MP4, WebM, MOV",
        });
        return;
      }

      const fileName = `${Date.now()}-${Math.random()
        .toString(16)
        .slice(2)}${ext}`;

      const filePath = path.join(overlayAssetsDir, fileName);
      const buffer = await file.toBuffer();

      fs.writeFileSync(filePath, buffer);

      const mediaType = getOverlayMediaType(fileName);

      reply.send({
        ok: true,
        url: `http://localhost:${PORT}/overlay-assets/${fileName}`,
        mediaType,
      });
    } catch (error) {
      reply.code(500).send({
        ok: false,
        url: "",
        mediaType: "none",
        error: error instanceof Error ? error.message : "Ошибка загрузки файла",
      });
    }
  });

  server.get("/app/version", async () => ({
    currentVersion: currentAppVersion,
  }));

  server.get("/settings", async () => getSafeSettings(appSettings));

  server.post("/settings", async (request, reply) => {
    const incomingSettings = request.body as Partial<AppSettings>;

    appSettings = normalizeSettings({
      ...appSettings,
      ...incomingSettings,
      twitchAuth: appSettings.twitchAuth || defaultTwitchAuth,
      youtubeAuth: appSettings.youtubeAuth || defaultYouTubeAuth,
    });

    saveSettings(appSettings);

    reply.send({ ok: true });
  });

  server.get("/messages", async () => messages);

  server.post("/messages/clear", async () => {
    clearMessages();
    return { ok: true };
  });

  server.get("/app/ws", { websocket: true }, (connection) => {
    appSockets.add(connection.socket);
    connection.socket.on("close", () => appSockets.delete(connection.socket));
  });

  server.get("/overlay/ws", { websocket: true }, (connection) => {
    overlaySockets.add(connection.socket);
    connection.socket.on("close", () => overlaySockets.delete(connection.socket));
  });

  server.get("/o", async (_request, reply) => {
    reply.type("text/html").send(makeOverlayHtml());
  });

  server.get("/twitch/status", async () => twitchChatClient.getStatus());

  server.get("/twitch/viewers", async () => {
    return getTwitchViewersStatus({
      sources: appSettings.sources,
      auth: appSettings.twitchAuth || defaultTwitchAuth,
      clientId: TWITCH_CLIENT_ID,
    });
  });

  server.get("/youtube/status", async () => youtubeChatClient.getStatus());

  server.get("/twitch/auth/status", async () => getSafeTwitchAuthState());

  server.get("/youtube/auth/status", async () => getSafeYouTubeAuthState());

  server.get("/twitch/auth/start", async (_request, reply) => {
    reply.redirect(buildTwitchAuthUrl());
  });

  server.get("/youtube/auth/start", async (_request, reply) => {
    if (
      !YOUTUBE_CLIENT_ID ||
      YOUTUBE_CLIENT_ID === "ТВОЙ_GOOGLE_OAUTH_CLIENT_ID"
    ) {
      reply.code(400).send({ ok: false, error: "YouTube OAuth не настроен" });
      return;
    }

    reply.redirect(buildYouTubeAuthUrl());
  });

  server.get("/twitch/auth/callback", async (_request, reply) => {
    reply.type("text/html").send(makeTwitchCallbackHtml());
  });

  server.get("/youtube/auth/callback", async (request, reply) => {
    try {
      const query = request.query as {
        code?: string;
        error?: string;
        error_description?: string;
      };

      if (query.error) {
        reply
          .type("text/html")
          .send(makeYouTubeCallbackHtml(false, query.error_description || query.error));
        return;
      }

      if (!query.code) {
        reply
          .type("text/html")
          .send(makeYouTubeCallbackHtml(false, "YouTube не вернул code"));
        return;
      }

      const token = await exchangeYouTubeCode(query.code);

      appSettings.youtubeAuth = {
        enabled: true,
        accessToken: token.access_token,
        refreshToken:
          token.refresh_token || appSettings.youtubeAuth?.refreshToken || null,
        scopes: token.scope ? token.scope.split(" ") : YOUTUBE_SCOPES,
        expiresAt: Date.now() + token.expires_in * 1000,
      };

      saveSettings(appSettings);

      reply
        .type("text/html")
        .send(makeYouTubeCallbackHtml(true, "YouTube Login готов."));
    } catch {
      reply
        .type("text/html")
        .send(makeYouTubeCallbackHtml(false, "Ошибка YouTube Login"));
    }
  });

  server.post("/twitch/auth/token", async (request, reply) => {
    try {
      const body = request.body as {
        accessToken?: string;
        scopes?: string[];
      };

      const accessToken =
        typeof body.accessToken === "string" ? body.accessToken.trim() : "";

      if (!accessToken) {
        reply.code(400).send({ ok: false, error: "Access token пустой" });
        return;
      }

      const tokenInfo = await validateTwitchToken(accessToken);

      if (tokenInfo.client_id !== TWITCH_CLIENT_ID) {
        reply.code(400).send({
          ok: false,
          error: "Token выдан для другого Twitch Client ID",
        });
        return;
      }

      const scopes = Array.isArray(tokenInfo.scopes)
        ? tokenInfo.scopes
        : body.scopes || [];

      appSettings.twitchAuth = {
        enabled: true,
        username: tokenInfo.login,
        accessToken,
        scopes,
        expiresAt: Date.now() + tokenInfo.expires_in * 1000,
      };

      const ownChannelName = normalizeTwitchChannelName(tokenInfo.login);

      const hasOwnTwitchSource = appSettings.sources.some(
        (source) =>
          source.platform === "twitch" && source.channelName === ownChannelName
      );

      if (!hasOwnTwitchSource) {
        appSettings.sources = [
          ...appSettings.sources,
          {
            id: createMessageId(),
            platform: "twitch",
            channelName: ownChannelName,
            enabled: true,
          },
        ];
      }

      saveSettings(appSettings);

      const twitchChannelNames = getEnabledTwitchChannelNames(appSettings.sources);

      let twitchStatus = twitchChatClient.getStatus();

      if (twitchChannelNames.length > 0) {
        twitchStatus = await twitchChatClient.connect(
          twitchChannelNames,
          appSettings.twitchAuth,
          appSettings.twitchEmotes
        );
      }

      reply.send({
        ok: true,
        auth: getSafeTwitchAuthState(),
        twitchStatus,
      });
    } catch {
      reply.code(400).send({
        ok: false,
        error: "Не удалось проверить Twitch token",
      });
    }
  });

  server.post("/twitch/auth/logout", async () => {
    appSettings.twitchAuth = { ...defaultTwitchAuth };
    saveSettings(appSettings);

    await twitchChatClient.disconnect();

    return {
      ok: true,
      auth: getSafeTwitchAuthState(),
      twitchStatus: twitchChatClient.getStatus(),
    };
  });

  server.post("/youtube/auth/logout", async () => {
    appSettings.youtubeAuth = { ...defaultYouTubeAuth };
    saveSettings(appSettings);

    await youtubeChatClient.disconnect();

    return {
      ok: true,
      auth: getSafeYouTubeAuthState(),
      youtubeStatus: youtubeChatClient.getStatus(),
    };
  });

  server.post("/chat/connect", async (request) => {
    const body = request.body as {
      sources?: ChatSource[];
      youtubeApiKey?: string;
      twitchEmotes?: Partial<TwitchEmoteSettings>;
    };

    if (Array.isArray(body.sources)) {
      appSettings.sources = body.sources;
    }

    if (typeof body.youtubeApiKey === "string") {
      appSettings.youtubeApiKey = body.youtubeApiKey;
    }

    if (body.twitchEmotes) {
      appSettings.twitchEmotes = {
        ...appSettings.twitchEmotes,
        ...body.twitchEmotes,
      };
    }

    saveSettings(appSettings);

    const twitchChannelNames = getEnabledTwitchChannelNames(appSettings.sources);
    const twitchAuth = appSettings.twitchAuth || defaultTwitchAuth;
    const youtubeAuth = await getUsableYouTubeAuth();

    const twitchStatus = await twitchChatClient.connect(
      twitchChannelNames,
      twitchAuth.enabled ? twitchAuth : null,
      appSettings.twitchEmotes
    );

    const youtubeStatus = await youtubeChatClient.connect(
      appSettings.sources,
      youtubeAuth.enabled ? youtubeAuth : null
    );

    return {
      ok: true,
      twitchStatus,
      youtubeStatus,
      mockStatus: getMockStatus(),
    };
  });

  server.post("/chat/disconnect", async () => {
    const twitchStatus = await twitchChatClient.disconnect();
    const youtubeStatus = await youtubeChatClient.disconnect();

    return {
      ok: true,
      twitchStatus,
      youtubeStatus,
      mockStatus: getMockStatus(),
    };
  });

  server.get("/mock/status", async () => getMockStatus());

  server.post("/mock/start", async () => {
    startMockMessages();
    return { ok: true, running: mockRunning };
  });

  server.post("/mock/stop", async () => {
    stopMockMessages();
    return { ok: true, running: mockRunning };
  });

  await server.listen({
    port: PORT,
    host: "127.0.0.1",
  });

  console.log(`Local server started: http://localhost:${PORT}`);
  logger.server("Local server started", {
    url: `http://localhost:${PORT}`,
  });
}