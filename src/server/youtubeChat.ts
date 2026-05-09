import { randomUUID } from "crypto";
import type {
  ChatMessage,
  ChatSource,
  YouTubeConnectionStatus,
} from "../shared/types";
import type { MessageHub } from "./messageHub";

type YouTubeVideoResponse = {
  items?: Array<{
    id?: string;
    snippet?: {
      title?: string;
      channelTitle?: string;
    };
    liveStreamingDetails?: {
      activeLiveChatId?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

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
    };
  }>;
  error?: {
    message?: string;
  };
};

type RunningYouTubeSource = {
  source: ChatSource;
  videoId: string;
  liveChatId: string;
  title: string;
  nextPageToken: string | null;
  seenMessageIds: Set<string>;
  timer: NodeJS.Timeout | null;
  stopped: boolean;
};

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

    const videoFromQuery = url.searchParams.get("v");

    if (videoFromQuery && /^[a-zA-Z0-9_-]{11}$/.test(videoFromQuery)) {
      return videoFromQuery;
    }

    const pathParts = url.pathname.split("/").filter(Boolean);

    if (url.hostname.includes("youtu.be") && pathParts[0]) {
      return pathParts[0];
    }

    const liveIndex = pathParts.indexOf("live");

    if (liveIndex >= 0 && pathParts[liveIndex + 1]) {
      return pathParts[liveIndex + 1];
    }

    const shortsIndex = pathParts.indexOf("shorts");

    if (shortsIndex >= 0 && pathParts[shortsIndex + 1]) {
      return pathParts[shortsIndex + 1];
    }
  } catch {
    // Это не ссылка, попробуем использовать строку как video id.
  }

  return value;
}

function buildUrl(baseUrl: string, params: Record<string, string>) {
  const url = new URL(baseUrl);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  return url.toString();
}

export class YouTubeChatClient {
  private readonly runningSources = new Map<string, RunningYouTubeSource>();

  private status: YouTubeConnectionStatus = {
    connected: false,
    sources: [],
    error: null,
  };

  constructor(private readonly messageHub: MessageHub) {}

  getStatus(): YouTubeConnectionStatus {
    return {
      connected: this.status.connected,
      sources: this.status.sources.map((source) => ({ ...source })),
      error: this.status.error,
    };
  }

  async connect(apiKey: string, sourcesInput: ChatSource[]) {
    await this.disconnect();

    const apiKeyValue = apiKey.trim();

    const youtubeSources = sourcesInput.filter(
      (source) => source.enabled && source.platform === "youtube"
    );

    if (youtubeSources.length === 0) {
      this.status = {
        connected: false,
        sources: [],
        error: null,
      };

      return this.getStatus();
    }

    if (!apiKeyValue) {
      this.status = {
        connected: false,
        sources: youtubeSources.map((source) => ({
          sourceId: source.id,
          input: source.channelName,
          videoId: null,
          liveChatId: null,
          title: null,
          connected: false,
          error: "Нужен YouTube API key",
        })),
        error: "Нужен YouTube API key",
      };

      return this.getStatus();
    }

    const sourceStatuses: YouTubeConnectionStatus["sources"] = [];

    for (const source of youtubeSources) {
      const videoId = extractYouTubeVideoId(source.channelName);

      if (!videoId) {
        sourceStatuses.push({
          sourceId: source.id,
          input: source.channelName,
          videoId: null,
          liveChatId: null,
          title: null,
          connected: false,
          error: "Не удалось определить YouTube video id",
        });

        continue;
      }

      try {
        const videoUrl = buildUrl("https://www.googleapis.com/youtube/v3/videos", {
          key: apiKeyValue,
          id: videoId,
          part: "snippet,liveStreamingDetails",
        });

        const videoResponse = await fetch(videoUrl);
        const videoData = (await videoResponse.json()) as YouTubeVideoResponse;

        if (!videoResponse.ok) {
          sourceStatuses.push({
            sourceId: source.id,
            input: source.channelName,
            videoId,
            liveChatId: null,
            title: null,
            connected: false,
            error: videoData.error?.message || "YouTube API не вернул данные по видео",
          });

          continue;
        }

        const video = videoData.items?.[0];
        const liveChatId = video?.liveStreamingDetails?.activeLiveChatId || "";
        const title = video?.snippet?.title || video?.snippet?.channelTitle || videoId;

        if (!liveChatId) {
          sourceStatuses.push({
            sourceId: source.id,
            input: source.channelName,
            videoId,
            liveChatId: null,
            title,
            connected: false,
            error:
              "У видео нет активного live chat. Возможно, стрим не идёт или чат выключен.",
          });

          continue;
        }

        const runningSource: RunningYouTubeSource = {
          source,
          videoId,
          liveChatId,
          title,
          nextPageToken: null,
          seenMessageIds: new Set<string>(),
          timer: null,
          stopped: false,
        };

        this.runningSources.set(source.id, runningSource);

        sourceStatuses.push({
          sourceId: source.id,
          input: source.channelName,
          videoId,
          liveChatId,
          title,
          connected: true,
          error: null,
        });

        this.pollSource(apiKeyValue, runningSource, true);
      } catch (error) {
        sourceStatuses.push({
          sourceId: source.id,
          input: source.channelName,
          videoId,
          liveChatId: null,
          title: null,
          connected: false,
          error: error instanceof Error ? error.message : "Ошибка подключения YouTube",
        });
      }
    }

    const connected = sourceStatuses.some((source) => source.connected);

    this.status = {
      connected,
      sources: sourceStatuses,
      error: connected ? null : "Нет подключённых YouTube-источников",
    };

    return this.getStatus();
  }

  async disconnect() {
    for (const runningSource of this.runningSources.values()) {
      runningSource.stopped = true;

      if (runningSource.timer) {
        clearTimeout(runningSource.timer);
      }
    }

    this.runningSources.clear();

    this.status = {
      connected: false,
      sources: [],
      error: null,
    };

    return this.getStatus();
  }

  private async pollSource(
    apiKey: string,
    runningSource: RunningYouTubeSource,
    skipExistingMessages: boolean
  ) {
    if (runningSource.stopped) {
      return;
    }

    try {
      const params: Record<string, string> = {
        key: apiKey,
        liveChatId: runningSource.liveChatId,
        part: "snippet,authorDetails",
        maxResults: "200",
      };

      if (runningSource.nextPageToken) {
        params.pageToken = runningSource.nextPageToken;
      }

      const chatUrl = buildUrl(
        "https://www.googleapis.com/youtube/v3/liveChat/messages",
        params
      );

      const response = await fetch(chatUrl);
      const data = (await response.json()) as YouTubeLiveChatResponse;

      if (!response.ok) {
        throw new Error(data.error?.message || "YouTube chat request failed");
      }

      runningSource.nextPageToken = data.nextPageToken || runningSource.nextPageToken;

      const items = data.items || [];

      for (const item of items) {
        const messageId = item.id || randomUUID();

        if (runningSource.seenMessageIds.has(messageId)) {
          continue;
        }

        runningSource.seenMessageIds.add(messageId);

        if (skipExistingMessages) {
          continue;
        }

        const text = item.snippet?.displayMessage || "";
        const authorName = item.authorDetails?.displayName || "YouTube Viewer";

        if (!text) {
          continue;
        }

        const message: ChatMessage = {
          id: randomUUID(),
          platform: "youtube",
          channelName: runningSource.title,
          authorName,
          text,
          timestamp: item.snippet?.publishedAt
            ? new Date(item.snippet.publishedAt).getTime()
            : Date.now(),
        };

        this.messageHub.addMessage(message);
      }

      const delay = Math.max(1000, data.pollingIntervalMillis || 3000);

      runningSource.timer = setTimeout(() => {
        this.pollSource(apiKey, runningSource, false);
      }, delay);
    } catch {
      runningSource.timer = setTimeout(() => {
        this.pollSource(apiKey, runningSource, false);
      }, 5000);
    }
  }
}