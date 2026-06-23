export type ChatPlatform = "twitch" | "youtube" | "mock";

export type OverlayPosition = "left" | "center" | "right";

export type OverlayStyleMode = "color" | "containerBubble" | "messageBubble";

export type OverlayBubbleMediaType = "none" | "image" | "video";

export type OverlayFilterSettings = {
  hideCommands: boolean;
  hideLinks: boolean;
  onlyWords: string;
  highlightWords: string;
};

export type ChatMessageEmote = {
  id: string;
  name: string;
  start: number;
  end: number;
  url: string;
  platform: "twitch" | "youtube" | "thirdParty";
};

export type UpdateSettings = {
  autoCheckEnabled: boolean;
  skippedVersion: string;
};

export type UpdateCheckResult = {
  ok: boolean;
  currentVersion: string;
  latestVersion: string | null;
  updateAvailable: boolean;
  releaseUrl: string | null;
  downloadUrl: string | null;
  releaseNotes: string;
  checkedAt: number;
  error?: string;
};

export type UpdateInstallResult = {
  ok: boolean;
  error?: string;
};

export type DiagnosticsInfo = {
  ok: boolean;
  logsDir: string;
  appVersion: string;
  platform: string;
  arch: string;
  nodeVersion: string;
  uptime: number;
  logFiles: {
    app: boolean;
    server: boolean;
    twitch: boolean;
    updates: boolean;
    errors: boolean;
  };
};

export type DiagnosticsArchiveResult = {
  ok: boolean;
  archivePath: string | null;
  error?: string;
};

export type DiagnosticsClearResult = {
  ok: boolean;
  error?: string;
};

export type DiagnosticsOpenLogsResult = {
  ok: boolean;
  logsDir: string;
  error?: string;
};

export type ChatMessage = {
  id: string;
  platform: ChatPlatform;
  channelName: string;
  authorName: string;
  text: string;
  timestamp: number;
  emotes?: ChatMessageEmote[];
  isSharedChat?: boolean;
  sourceChannelId?: string;
};

export type ChatSource = {
  id: string;
  platform: Exclude<ChatPlatform, "mock">;
  channelName: string;
  enabled: boolean;
};

export type OverlaySettings = {
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  chatWidth: number;
  maxMessages: number;
  position: OverlayPosition;

  showPlatformIcon: boolean;
  showChannelName: boolean;
  showAuthorName: boolean;

  backgroundOpacity: number;
  backgroundColor: string;
  borderRadius: number;
  messageGap: number;

  styleMode: OverlayStyleMode;
  showStyleInApp: boolean;
  bubbleMediaUrl: string;
  bubbleMediaType: OverlayBubbleMediaType;

  filters: OverlayFilterSettings;
};

export type TwitchAuthState = {
  enabled: boolean;
  username: string | null;
  accessToken: string | null;
  scopes: string[];
  expiresAt: number | null;
};

export type SafeTwitchAuthState = {
  enabled: boolean;
  username: string | null;
  scopes: string[];
  expiresAt: number | null;
  hasToken: boolean;
};

export type YouTubeAuthState = {
  enabled: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  scopes: string[];
  expiresAt: number | null;
};

export type SafeYouTubeAuthState = {
  enabled: boolean;
  scopes: string[];
  expiresAt: number | null;
  hasAccessToken: boolean;
  hasRefreshToken: boolean;
  configured: boolean;
};

export type AppSettings = {
  sources: ChatSource[];
  youtubeApiKey: string;
  overlay: OverlaySettings;
  updates: UpdateSettings;
  twitchAuth?: TwitchAuthState;
  youtubeAuth?: YouTubeAuthState;
};

export type TwitchConnectionStatus = {
  connected: boolean;
  channelNames: string[];
  error: string | null;
  authenticated: boolean;
  username: string | null;
};

export type YouTubeSourceConnectionStatus = {
  id: string;
  platform: "youtube";
  channelName: string;
  connected: boolean;
  error: string | null;
};

export type YouTubeConnectionStatus = {
  connected: boolean;
  sources: YouTubeSourceConnectionStatus[];
  error: string | null;
};

export type TwitchViewerCount = {
  channelName: string;
  viewerCount: number;
  live: boolean;
  error: string | null;
};

export type TwitchViewersStatus = {
  totalViewers: number;
  channels: TwitchViewerCount[];
  error: string | null;
};

export type UploadedOverlayAsset = {
  ok: boolean;
  url: string;
  mediaType: OverlayBubbleMediaType;
  error?: string;
};
