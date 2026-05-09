import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import Fastify from "fastify";
import websocket from "@fastify/websocket";
import type {
  AppSettings,
  ChatMessage,
  ChatSource,
  OverlaySettings,
  SafeTwitchAuthState,
  TwitchAuthState,
  YouTubeConnectionStatus,
} from "../shared/types";
import { TwitchChatClient } from "./twitchChat";

const PORT = 3877;

const TWITCH_CLIENT_ID = "18ipdprohcqbx04oykqelu0a3h92mc";
const TWITCH_REDIRECT_URI = `http://localhost:${PORT}/twitch/auth/callback`;
const TWITCH_SCOPES = ["chat:read", "chat:write"];

const settingsDir = path.join(os.homedir(), ".stream-chat-hub");
const settingsFilePath = path.join(settingsDir, "settings.json");

const defaultOverlaySettings: OverlaySettings = {
  width: 800,
  height: 600,
  fontSize: 24,
  chatWidth: 520,
  maxMessages: 12,
  position: "left",

  showPlatformIcon: true,
  showChannelName: true,
  showAuthorName: true,

  backgroundOpacity: 65,
  borderRadius: 12,
  messageGap: 8,

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

const defaultSettings: AppSettings = {
  sources: [],
  youtubeApiKey: "",
  overlay: defaultOverlaySettings,
  twitchAuth: defaultTwitchAuth,
};

const defaultYouTubeStatus: YouTubeConnectionStatus = {
  connected: false,
  sources: [],
  error: null,
};

let appSettings = loadSettings();
let messages: ChatMessage[] = [];
let mockTimer: NodeJS.Timeout | null = null;
let mockRunning = false;

const appSockets = new Set<any>();
const overlaySockets = new Set<any>();

const twitchChatClient = new TwitchChatClient((message) => {
  pushMessage(message);
});

function createMessageId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function ensureSettingsDir() {
  if (!fs.existsSync(settingsDir)) {
    fs.mkdirSync(settingsDir, {
      recursive: true,
    });
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
  fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2), "utf-8");
}

function normalizeSettings(settings: Partial<AppSettings>): AppSettings {
  return {
    sources: Array.isArray(settings.sources) ? settings.sources : [],
    youtubeApiKey:
      typeof settings.youtubeApiKey === "string" ? settings.youtubeApiKey : "",
    overlay: {
      ...defaultOverlaySettings,
      ...(settings.overlay || {}),
      filters: {
        ...defaultOverlaySettings.filters,
        ...(settings.overlay?.filters || {}),
      },
    },
    twitchAuth: {
      ...defaultTwitchAuth,
      ...(settings.twitchAuth || {}),
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

function normalizeTwitchChannelName(channelName: string) {
  return channelName.trim().replace(/^#/, "").replace(/^@/, "").toLowerCase();
}

function getEnabledTwitchChannelNames(sources: ChatSource[]) {
  return sources
    .filter((source) => source.enabled && source.platform === "twitch")
    .map((source) => normalizeTwitchChannelName(source.channelName))
    .filter(Boolean);
}

function pushMessage(message: ChatMessage) {
  messages.push(message);
  messages = messages.slice(-300);

  const payload = JSON.stringify(message);

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
  if (mockTimer) {
    return;
  }

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
  return {
    running: mockRunning,
  };
}

function makeOverlayHtml() {
  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <title>Stream Chat Hub Overlay</title>
  <style>
    * {
      box-sizing: border-box;
    }

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
      display: inline-block;
      max-width: 100%;
      padding: 10px 12px;
      background: rgba(0, 0, 0, 0.65);
      border-radius: 12px;
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
      color: #fde68a;
      font-weight: 950;
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

    function applySettings() {
      const overlay = settings.overlay;

      document.body.style.width = overlay.width + "px";
      document.body.style.height = overlay.height + "px";

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
    }

    function render() {
      if (!settings) {
        return;
      }

      applySettings();

      const overlay = settings.overlay;
      const visibleMessages = messages
        .filter(messagePassesFilters)
        .slice(-overlay.maxMessages);

      chat.innerHTML = visibleMessages
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

          const backgroundOpacity = Math.max(0, Math.min(100, overlay.backgroundOpacity)) / 100;

          return [
            '<div class="message">',
              '<div class="messageInner" style="background: rgba(0, 0, 0, ' + backgroundOpacity + '); border-radius: ' + overlay.borderRadius + 'px;">',
                '<span class="meta">',
                  parts.join(""),
                '</span>',
                '<span class="text">' + highlightText(message.text) + '</span>',
              '</div>',
            '</div>'
          ].join("");
        })
        .join("");
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

    setInterval(loadSettings, 1000);
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

    .ok {
      color: #bbf7d0;
    }

    .error {
      color: #fecaca;
    }
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
          headers: {
            "Content-Type": "application/json",
          },
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
      } catch (error) {
        status.className = "error";
        status.textContent = "Ошибка Twitch-входа";
      }
    }

    finishAuth();
  </script>
</body>
</html>`;
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

export async function startLocalServer() {
  const server = Fastify({
    logger: false,
  });

  await server.register(websocket);

  server.addHook("onRequest", async (_request, reply) => {
    reply.header("Access-Control-Allow-Origin", "*");
    reply.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    reply.header("Access-Control-Allow-Headers", "Content-Type");
  });

  server.options("*", async (_request, reply) => {
    reply.send();
  });

  server.get("/settings", async () => {
    return getSafeSettings(appSettings);
  });

  server.post("/settings", async (request, reply) => {
    const incomingSettings = request.body as Partial<AppSettings>;

    appSettings = normalizeSettings({
      ...appSettings,
      ...incomingSettings,
      twitchAuth: appSettings.twitchAuth || defaultTwitchAuth,
    });

    saveSettings(appSettings);

    reply.send({
      ok: true,
    });
  });

  server.get("/messages", async () => {
    return messages;
  });

  server.post("/messages/clear", async () => {
    clearMessages();

    return {
      ok: true,
    };
  });

  server.get("/app/ws", { websocket: true }, (connection) => {
    appSockets.add(connection.socket);

    connection.socket.on("close", () => {
      appSockets.delete(connection.socket);
    });
  });

  server.get("/overlay/ws", { websocket: true }, (connection) => {
    overlaySockets.add(connection.socket);

    connection.socket.on("close", () => {
      overlaySockets.delete(connection.socket);
    });
  });

  server.get("/o", async (_request, reply) => {
    reply.type("text/html").send(makeOverlayHtml());
  });

  server.get("/twitch/status", async () => {
    return twitchChatClient.getStatus();
  });

  server.get("/youtube/status", async () => {
    return defaultYouTubeStatus;
  });

  server.get("/twitch/auth/status", async () => {
    return getSafeTwitchAuthState();
  });

  server.get("/twitch/auth/start", async (_request, reply) => {
    reply.redirect(buildTwitchAuthUrl());
  });

  server.get("/twitch/auth/callback", async (_request, reply) => {
    reply.type("text/html").send(makeTwitchCallbackHtml());
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
        reply.code(400).send({
          ok: false,
          error: "Access token пустой",
        });

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
      const expiresAt = Date.now() + tokenInfo.expires_in * 1000;

      appSettings.twitchAuth = {
        enabled: true,
        username: tokenInfo.login,
        accessToken,
        scopes,
        expiresAt,
      };

      saveSettings(appSettings);

      reply.send({
        ok: true,
        auth: getSafeTwitchAuthState(),
      });
    } catch {
      reply.code(400).send({
        ok: false,
        error: "Не удалось проверить Twitch token",
      });
    }
  });

  server.post("/twitch/auth/logout", async () => {
    appSettings.twitchAuth = {
      ...defaultTwitchAuth,
    };

    saveSettings(appSettings);

    await twitchChatClient.disconnect();

    return {
      ok: true,
      auth: getSafeTwitchAuthState(),
      twitchStatus: twitchChatClient.getStatus(),
    };
  });

  server.post("/chat/connect", async (request) => {
    const body = request.body as {
      sources?: ChatSource[];
      youtubeApiKey?: string;
    };

    if (Array.isArray(body.sources)) {
      appSettings.sources = body.sources;
    }

    if (typeof body.youtubeApiKey === "string") {
      appSettings.youtubeApiKey = body.youtubeApiKey;
    }

    saveSettings(appSettings);

    const twitchChannelNames = getEnabledTwitchChannelNames(appSettings.sources);
    const twitchAuth = appSettings.twitchAuth || defaultTwitchAuth;

    const twitchStatus = await twitchChatClient.connect(
      twitchChannelNames,
      twitchAuth.enabled ? twitchAuth : null
    );

    return {
      ok: true,
      twitchStatus,
      youtubeStatus: defaultYouTubeStatus,
      mockStatus: getMockStatus(),
    };
  });

  server.post("/chat/disconnect", async () => {
    const twitchStatus = await twitchChatClient.disconnect();

    return {
      ok: true,
      twitchStatus,
      youtubeStatus: defaultYouTubeStatus,
      mockStatus: getMockStatus(),
    };
  });

  server.get("/mock/status", async () => {
    return getMockStatus();
  });

  server.post("/mock/start", async () => {
    startMockMessages();

    return {
      ok: true,
      running: mockRunning,
    };
  });

  server.post("/mock/stop", async () => {
    stopMockMessages();

    return {
      ok: true,
      running: mockRunning,
    };
  });

  await server.listen({
    port: PORT,
    host: "127.0.0.1",
  });

  console.log(`Local server started: http://localhost:${PORT}`);
}