export type ChatPlatform = "twitch" | "youtube" | "mock";

export type OverlayPosition = "left" | "center" | "right";

export type OverlayFilterSettings = {
  hideCommands: boolean;
  hideLinks: boolean;
  onlyWords: string;
  highlightWords: string;
};

export type ChatMessage = {
  id: string;
  platform: ChatPlatform;
  channelName: string;
  authorName: string;
  text: string;
  timestamp: number;
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
  chatWidth: number;
  maxMessages: number;
  position: OverlayPosition;

  showPlatformIcon: boolean;
  showChannelName: boolean;
  showAuthorName: boolean;

  backgroundOpacity: number;
  borderRadius: number;
  messageGap: number;

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