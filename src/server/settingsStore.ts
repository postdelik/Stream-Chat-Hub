import { randomUUID } from "crypto";
import { existsSync } from "fs";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import type {
  AppSettings,
  ChatSource,
  OverlayFilterSettings,
  OverlayPosition,
  OverlaySettings,
} from "../shared/types";

const DEFAULT_FILTER_SETTINGS: OverlayFilterSettings = {
  hideCommands: false,
  hideLinks: false,
  onlyWords: "",
  highlightWords: "",
};

const DEFAULT_OVERLAY_SETTINGS: OverlaySettings = {
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

  filters: DEFAULT_FILTER_SETTINGS,
};

const DEFAULT_APP_SETTINGS: AppSettings = {
  sources: [],
  youtubeApiKey: "",
  overlay: DEFAULT_OVERLAY_SETTINGS,
};

function clampNumber(value: unknown, fallback: number, min: number, max: number) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, numberValue));
}

function normalizeBoolean(value: unknown, fallback: boolean) {
  if (typeof value === "boolean") {
    return value;
  }

  return fallback;
}

function normalizeString(value: unknown, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }

  return value;
}

function normalizePosition(value: unknown): OverlayPosition {
  if (value === "center" || value === "right" || value === "left") {
    return value;
  }

  return "left";
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

export function normalizeOverlaySettings(value: unknown): OverlaySettings {
  const data = value as Partial<OverlaySettings>;

  return {
    width: clampNumber(data.width, DEFAULT_OVERLAY_SETTINGS.width, 100, 5000),
    height: clampNumber(data.height, DEFAULT_OVERLAY_SETTINGS.height, 100, 5000),
    fontSize: clampNumber(data.fontSize, DEFAULT_OVERLAY_SETTINGS.fontSize, 10, 120),
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
    youtubeApiKey: typeof data.youtubeApiKey === "string" ? data.youtubeApiKey : "",
    overlay: normalizeOverlaySettings(data.overlay || DEFAULT_OVERLAY_SETTINGS),
  };
}

export class SettingsStore {
  private readonly settingsDirectory: string;
  private readonly settingsFilePath: string;

  constructor() {
    const appDataDirectory =
      process.env.APPDATA ||
      process.env.LOCALAPPDATA ||
      process.env.HOME ||
      process.cwd();

    this.settingsDirectory = path.join(appDataDirectory, "StreamChatHub");
    this.settingsFilePath = path.join(this.settingsDirectory, "settings.json");
  }

  getSettingsFilePath() {
    return this.settingsFilePath;
  }

  async load(): Promise<AppSettings> {
    if (!existsSync(this.settingsFilePath)) {
      await this.save(DEFAULT_APP_SETTINGS);
      return DEFAULT_APP_SETTINGS;
    }

    try {
      const rawSettings = await readFile(this.settingsFilePath, "utf-8");
      const parsedSettings = JSON.parse(rawSettings);

      return normalizeAppSettings(parsedSettings);
    } catch {
      await this.save(DEFAULT_APP_SETTINGS);
      return DEFAULT_APP_SETTINGS;
    }
  }

  async save(settings: AppSettings) {
    const normalizedSettings = normalizeAppSettings(settings);

    await mkdir(this.settingsDirectory, {
      recursive: true,
    });

    await writeFile(
      this.settingsFilePath,
      JSON.stringify(normalizedSettings, null, 2),
      "utf-8"
    );

    return normalizedSettings;
  }
}