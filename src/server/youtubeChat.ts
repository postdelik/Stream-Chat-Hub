import type {
  ChatMessage,
  ChatSource,
  YouTubeAuthState,
  YouTubeConnectionStatus,
} from "../shared/types";

type YouTubeLiveChatResponse = {
  nextPageToken?: string;
  pollingIntervalMillis?: number;
  items?: Array<{
    id?: string;
    snippet?: {
      displayMessage?: string;
      publishedAt?: string;
    };
    authorDetails?: {
      displayName?: string;
      channelId?: string;
    };
  }>;
};

type YouTubeVideoResponse = {
  items?: Array<{
    id: string;
    liveStreamingDetails?: {
      activeLiveChatId?: string;
    };
  }>;
};

type YouTubeConnectedSource = {
  id: string;
  platform: "youtube";
  channelName: string;
  connected: boolean;
  error: string | null;
};

function createMessageId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function extractYouTubeVideoId(input: string) {
  const value = input.trim();

  if (!value) {
    return "";
  }

  if (/^[a-zA-Z0-9_-]{11}$/.test(value)) {
    return value;
  }

  try {
    const url = new URL(value);

    if (url.hostname.includes("youtu.be")) {
      return url.pathname.replace("/", "").slice(0, 11);
    }

    const videoId = url.searchParams.get("v");

    if (videoId) {
      return videoId.slice(0, 11);
    }

    const liveMatch = url.pathname.match(/\/live\/([a-zA-Z0-9_-]{11})/);

    if (liveMatch?.[1]) {
      return liveMatch[1];
    }

    const shortsMatch = url.pathname.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);

    if (shortsMatch?.[1]) {
      return shortsMatch[1];
    }

    return "";
  } catch {
    return "";
  }
}

async function fetchJson<T>(url: string, accessToken: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`YouTube API error ${response.status}: ${text}`);
  }

  return (await response.json()) as T;
}

async function getLiveChatId(videoId: string, accessToken: string) {
  const params = new URLSearchParams({
    part: "liveStreamingDetails",
    id: videoId,
  });

  const data = await fetchJson<YouTubeVideoResponse>(
    `https://www.googleapis.com/youtube/v3/videos?${params.toString()}`,
    accessToken
  );

  const liveChatId = data.items?.[0]?.liveStreamingDetails?.activeLiveChatId;

  if (!liveChatId) {
    throw new Error("У этого YouTube-видео нет активного live-чата");
  }

  return liveChatId;
}

export class YouTubeChatClient {
  private timers = new Map<string, NodeJS.Timeout>();
  private nextPageTokens = new Map<string, string>();

  private status: YouTubeConnectionStatus = {
    connected: false,
    sources: [],
    error: null,
  };

  constructor(private readonly onMessage: (message: ChatMessage) => void) {}

  getStatus() {
    return this.status;
  }

  async connect(sources: ChatSource[], auth?: YouTubeAuthState | null) {
    await this.disconnect();

    const youtubeSources = sources.filter(
      (source) => source.enabled && source.platform === "youtube"
    );

    if (youtubeSources.length === 0) {
      this.status = {
        connected: false,
        sources: [],
        error: null,
      };

      return this.status;
    }

    if (!auth?.enabled || !auth.accessToken) {
      this.status = {
        connected: false,
        sources: youtubeSources.map((source) => ({
          id: source.id,
          platform: "youtube",
          channelName: source.channelName,
          connected: false,
          error: "Требуется YouTube Login",
        })),
        error: "Требуется YouTube Login",
      };

      return this.status;
    }

    const connectedSources: YouTubeConnectedSource[] = [];

    for (const source of youtubeSources) {
      const videoId = extractYouTubeVideoId(source.channelName);

      if (!videoId) {
        connectedSources.push({
          id: source.id,
          platform: "youtube",
          channelName: source.channelName,
          connected: false,
          error: "Не удалось определить YouTube videoId",
        });

        continue;
      }

      try {
        console.log("[YOUTUBE] Connecting source:", source.channelName);
        console.log("[YOUTUBE] Video ID:", videoId);

        const liveChatId = await getLiveChatId(videoId, auth.accessToken);

        console.log("[YOUTUBE] Live chat ID:", liveChatId);

        connectedSources.push({
          id: source.id,
          platform: "youtube",
          channelName: videoId,
          connected: true,
          error: null,
        });

        this.pollLiveChat({
          sourceId: source.id,
          videoId,
          liveChatId,
          accessToken: auth.accessToken,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Ошибка YouTube подключения";

        console.error("[YOUTUBE ERROR]", errorMessage);

        connectedSources.push({
          id: source.id,
          platform: "youtube",
          channelName: source.channelName,
          connected: false,
          error: errorMessage,
        });
      }
    }

    const connected = connectedSources.some((source) => source.connected);
    const firstError =
      connectedSources.find((source) => source.error)?.error ?? null;

    this.status = {
      connected,
      sources: connectedSources,
      error: connected ? null : firstError,
    };

    return this.status;
  }

  async disconnect() {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }

    this.timers.clear();
    this.nextPageTokens.clear();

    this.status = {
      connected: false,
      sources: [],
      error: null,
    };

    return this.status;
  }

  private pollLiveChat({
    sourceId,
    videoId,
    liveChatId,
    accessToken,
  }: {
    sourceId: string;
    videoId: string;
    liveChatId: string;
    accessToken: string;
  }) {
    const run = async () => {
      try {
        const params = new URLSearchParams({
          part: "snippet,authorDetails",
          liveChatId,
        });

        const pageToken = this.nextPageTokens.get(sourceId);

        if (pageToken) {
          params.set("pageToken", pageToken);
        }

        const data = await fetchJson<YouTubeLiveChatResponse>(
          `https://www.googleapis.com/youtube/v3/liveChat/messages?${params.toString()}`,
          accessToken
        );

        if (data.nextPageToken) {
          this.nextPageTokens.set(sourceId, data.nextPageToken);
        }

        for (const item of data.items || []) {
          const text = item.snippet?.displayMessage || "";

          if (!text) {
            continue;
          }

          const authorName = item.authorDetails?.displayName || "unknown";

          console.log(`[YOUTUBE MESSAGE] ${authorName}: ${text}`);

          this.onMessage({
            id: item.id || createMessageId(),
            platform: "youtube",
            channelName: videoId,
            authorName,
            text,
            timestamp: item.snippet?.publishedAt
              ? new Date(item.snippet.publishedAt).getTime()
              : Date.now(),
          });
        }

        const delay = Math.max(data.pollingIntervalMillis || 5000, 2000);

        const timer = setTimeout(run, delay);
        this.timers.set(sourceId, timer);
      } catch (error) {
        console.error("[YOUTUBE POLL ERROR]", error);

        const timer = setTimeout(run, 10000);
        this.timers.set(sourceId, timer);
      }
    };

    void run();
  }
}