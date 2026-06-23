import { randomUUID } from "crypto";
import { existsSync } from "fs";
import { mkdir, readFile, writeFile } from "fs/promises";
import os from "os";
import path from "path";
import type {
  AppSettings,
  ChatSource,
  OverlayBubbleMediaType,
  OverlayFilterSettings,
  OverlayPosition,
  OverlaySettings,
  OverlayStyleMode,
  TwitchEmoteSettings,
  UpdateSettings,
} from "../shared/types";

const SETTINGS_DIR = path.join(os.homedir(), ".stream-chat-hub");
const SETTINGS_FILE = path.join(SETTINGS_DIR, "settings.json");

const DEFAULT_FILTER_SETTINGS: OverlayFilterSettings = {
  hideCommands: false,
  hideLinks: false,
  onlyWords: "",
  highlightWords: "",
};

const DEFAULT_UPDATE_SETTINGS: UpdateSettings = {
  autoCheckEnabled: true,
  skippedVersion: "",
};

const DEFAULT_TWITCH_EMOTE_SETTINGS: TwitchEmoteSettings = {
  sevenTvEnabled: true,
  betterTtvEnabled: true,
  frankerFaceZEnabled: true,
};

const DEFAULT_OVERLAY_SETTINGS: OverlaySettings = {
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

  filters: DEFAULT_FILTER_SETTINGS,
};

const DEFAULT_APP_SETTINGS: AppSettings = {
  sources: [],
  youtubeApiKey: "",
  overlay: DEFAULT_OVERLAY_SETTINGS,
  updates: DEFAULT_UPDATE_SETTINGS,
  twitchEmotes: DEFAULT_TWITCH_EMOTE_SETTINGS,
};

function clampNumber(value: unknown, fallback: number, min: number, max: number) {
  const numberValue = Number(value);

  return Number.isFinite(numberValue)
    ? Math.min(max, Math.max(min, numberValue))
    : fallback;
}

function normalizeBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function normalizeString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function normalizeHexColor(value: unknown, fallback = "#000000") {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();

  return /^#[0-9a-fA-F]{6}$/.test(trimmed) ? trimmed : fallback;
}

function normalizePosition(value: unknown): OverlayPosition {
  if (value === "center" || value === "right" || value === "left") {
    return value;
  }

  return "left";
}

function normalizeStyleMode(value: unknown): OverlayStyleMode {
  if (
    value === "color" ||
    value === "containerBubble" ||
    value === "messageBubble"
  ) {
    return value;
  }

  if (value === "container") {
    return "containerBubble";
  }

  if (value === "message") {
    return "messageBubble";
  }

  return "messageBubble";
}

function normalizeBubbleMediaType(value: unknown): OverlayBubbleMediaType {
  if (value === "image" || value === "video" || value === "none") {
    return value;
  }

  return "none";
}

function normalizeTwitchChannelName(channelName: unknown) {
  if (typeof channelName !== "string") {
    return "";
  }

  return channelName.trim().replace(/^#/, "").replace(/^@/, "").toLowerCase();
}

function normalizeYouTubeInput(channelName: unknown) {
  if (typeof channelName !== "string") {
    return "";
  }

  return channelName.trim();
}

function normalizeSource(value: unknown): ChatSource | null {
  const data = value as Partial<ChatSource>;

  const platform =
    data.platform === "youtube" || data.platform === "twitch"
      ? data.platform
      : "twitch";

  const channelName =
    platform === "twitch"
      ? normalizeTwitchChannelName(data.channelName)
      : normalizeYouTubeInput(data.channelName);

  if (!channelName) {
    return null;
  }

  return {
    id: typeof data.id === "string" && data.id ? data.id : randomUUID(),
    platform,
    channelName,
    enabled: typeof data.enabled === "boolean" ? data.enabled : true,
  };
}

function normalizeSources(value: unknown): ChatSource[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const sources = value.map(normalizeSource).filter(Boolean) as ChatSource[];
  const uniqueSources = new Map<string, ChatSource>();

  for (const source of sources) {
    const key = `${source.platform}:${source.channelName}`;

    if (!uniqueSources.has(key)) {
      uniqueSources.set(key, source);
    }
  }

  return Array.from(uniqueSources.values());
}

function migrateOldTwitchChannelNames(value: unknown): ChatSource[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(normalizeTwitchChannelName)
    .filter(Boolean)
    .map((channelName) => ({
      id: randomUUID(),
      platform: "twitch" as const,
      channelName,
      enabled: true,
    }));
}

function migrateOldTwitchChannelName(value: unknown): ChatSource[] {
  const channelName = normalizeTwitchChannelName(value);

  if (!channelName) {
    return [];
  }

  return [
    {
      id: randomUUID(),
      platform: "twitch",
      channelName,
      enabled: true,
    },
  ];
}

export function normalizeOverlayFilterSettings(
  value: unknown
): OverlayFilterSettings {
  const data = value as Partial<OverlayFilterSettings>;

  return {
    hideCommands: normalizeBoolean(
      data.hideCommands,
      DEFAULT_FILTER_SETTINGS.hideCommands
    ),
    hideLinks: normalizeBoolean(data.hideLinks, DEFAULT_FILTER_SETTINGS.hideLinks),
    onlyWords: normalizeString(data.onlyWords, DEFAULT_FILTER_SETTINGS.onlyWords),
    highlightWords: normalizeString(
      data.highlightWords,
      DEFAULT_FILTER_SETTINGS.highlightWords
    ),
  };
}

export function normalizeUpdateSettings(value: unknown): UpdateSettings {
  const data = value as Partial<UpdateSettings>;

  return {
    autoCheckEnabled: normalizeBoolean(
      data.autoCheckEnabled,
      DEFAULT_UPDATE_SETTINGS.autoCheckEnabled
    ),
    skippedVersion: normalizeString(
      data.skippedVersion,
      DEFAULT_UPDATE_SETTINGS.skippedVersion
    ),
  };
}

export function normalizeTwitchEmoteSettings(
  value: unknown
): TwitchEmoteSettings {
  const data = value as Partial<TwitchEmoteSettings>;

  return {
    sevenTvEnabled: normalizeBoolean(
      data.sevenTvEnabled,
      DEFAULT_TWITCH_EMOTE_SETTINGS.sevenTvEnabled
    ),
    betterTtvEnabled: normalizeBoolean(
      data.betterTtvEnabled,
      DEFAULT_TWITCH_EMOTE_SETTINGS.betterTtvEnabled
    ),
    frankerFaceZEnabled: normalizeBoolean(
      data.frankerFaceZEnabled,
      DEFAULT_TWITCH_EMOTE_SETTINGS.frankerFaceZEnabled
    ),
  };
}

export function normalizeOverlaySettings(value: unknown): OverlaySettings {
  const data = value as Partial<OverlaySettings>;

  return {
    width: clampNumber(data.width, DEFAULT_OVERLAY_SETTINGS.width, 100, 5000),
    height: clampNumber(data.height, DEFAULT_OVERLAY_SETTINGS.height, 100, 5000),
    fontSize: clampNumber(
      data.fontSize,
      DEFAULT_OVERLAY_SETTINGS.fontSize,
      10,
      120
    ),
    fontFamily: normalizeString(
      data.fontFamily,
      DEFAULT_OVERLAY_SETTINGS.fontFamily
    ),
    chatWidth: clampNumber(
      data.chatWidth,
      DEFAULT_OVERLAY_SETTINGS.chatWidth,
      200,
      3000
    ),
    maxMessages: clampNumber(
      data.maxMessages,
      DEFAULT_OVERLAY_SETTINGS.maxMessages,
      1,
      100
    ),
    position: normalizePosition(data.position),

    showPlatformIcon: normalizeBoolean(
      data.showPlatformIcon,
      DEFAULT_OVERLAY_SETTINGS.showPlatformIcon
    ),
    showChannelName: normalizeBoolean(
      data.showChannelName,
      DEFAULT_OVERLAY_SETTINGS.showChannelName
    ),
    showAuthorName: normalizeBoolean(
      data.showAuthorName,
      DEFAULT_OVERLAY_SETTINGS.showAuthorName
    ),

    backgroundOpacity: clampNumber(
      data.backgroundOpacity,
      DEFAULT_OVERLAY_SETTINGS.backgroundOpacity,
      0,
      100
    ),
    backgroundColor: normalizeHexColor(
      data.backgroundColor,
      DEFAULT_OVERLAY_SETTINGS.backgroundColor
    ),
    borderRadius: clampNumber(
      data.borderRadius,
      DEFAULT_OVERLAY_SETTINGS.borderRadius,
      0,
      60
    ),
    messageGap: clampNumber(
      data.messageGap,
      DEFAULT_OVERLAY_SETTINGS.messageGap,
      0,
      40
    ),

    styleMode: normalizeStyleMode(data.styleMode),
    showStyleInApp: normalizeBoolean(
      data.showStyleInApp,
      DEFAULT_OVERLAY_SETTINGS.showStyleInApp
    ),
    bubbleMediaUrl: normalizeString(data.bubbleMediaUrl),
    bubbleMediaType: normalizeBubbleMediaType(data.bubbleMediaType),

    filters: normalizeOverlayFilterSettings(data.filters),
  };
}

export function normalizeAppSettings(value: unknown): AppSettings {
  const data = value as Partial<AppSettings> & {
    twitchChannelNames?: string[];
    twitchChannelName?: string;
  };

  const newSources = normalizeSources(data.sources);

  const migratedSources =
    newSources.length > 0
      ? newSources
      : [
          ...migrateOldTwitchChannelNames(data.twitchChannelNames),
          ...migrateOldTwitchChannelName(data.twitchChannelName),
        ];

  return {
    sources: migratedSources,
    youtubeApiKey: normalizeString(data.youtubeApiKey),
    overlay: normalizeOverlaySettings(data.overlay),
    updates: normalizeUpdateSettings(data.updates),
    twitchEmotes: normalizeTwitchEmoteSettings(data.twitchEmotes),
    twitchAuth: data.twitchAuth,
    youtubeAuth: data.youtubeAuth,
  };
}

export async function loadSettings() {
  if (!existsSync(SETTINGS_DIR)) {
    await mkdir(SETTINGS_DIR, { recursive: true });
  }

  if (!existsSync(SETTINGS_FILE)) {
    await saveSettings(DEFAULT_APP_SETTINGS);
    return DEFAULT_APP_SETTINGS;
  }

  try {
    const raw = await readFile(SETTINGS_FILE, "utf-8");
    return normalizeAppSettings(JSON.parse(raw));
  } catch {
    return DEFAULT_APP_SETTINGS;
  }
}

export async function saveSettings(settings: AppSettings) {
  if (!existsSync(SETTINGS_DIR)) {
    await mkdir(SETTINGS_DIR, { recursive: true });
  }

  const normalized = normalizeAppSettings(settings);
  await writeFile(SETTINGS_FILE, JSON.stringify(normalized, null, 2), "utf-8");
}
