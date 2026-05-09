import type {
  ChatMessage,
  TwitchAuthState,
  TwitchConnectionStatus,
} from "../shared/types";

const tmi = require("tmi.js");

type TwitchUserState = {
  username?: string;
  "display-name"?: string;
  badges?: Record<string, string>;
  id?: string;
};

type TwitchClientLike = {
  connect: () => Promise<[string, number]>;
  disconnect: () => Promise<[string, number]>;
  on: (eventName: string, callback: (...args: any[]) => void) => void;
};

function createMessageId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeChannelName(channelName: string) {
  return channelName.trim().replace(/^#/, "").replace(/^@/, "").toLowerCase();
}

function normalizeOAuthToken(token: string) {
  const trimmedToken = token.trim();

  if (!trimmedToken) {
    return "";
  }

  if (trimmedToken.startsWith("oauth:")) {
    return trimmedToken;
  }

  return `oauth:${trimmedToken}`;
}

export class TwitchChatClient {
  private client: TwitchClientLike | null = null;

  private status: TwitchConnectionStatus = {
    connected: false,
    channelNames: [],
    error: null,
    authenticated: false,
    username: null,
  };

  constructor(private readonly onMessage: (message: ChatMessage) => void) {}

  getStatus() {
    return this.status;
  }

  async connect(channelNames: string[], auth?: TwitchAuthState | null) {
    await this.disconnect();

    const normalizedChannelNames = Array.from(
      new Set(
        channelNames
          .map((channelName) => normalizeChannelName(channelName))
          .filter(Boolean)
      )
    );

    const useAuth = Boolean(auth?.enabled && auth.username && auth.accessToken);

    if (normalizedChannelNames.length === 0) {
      this.status = {
        connected: false,
        channelNames: [],
        error: "Нет Twitch-каналов для подключения",
        authenticated: useAuth,
        username: useAuth ? auth?.username ?? null : null,
      };

      return this.status;
    }

    try {
      const options: Record<string, unknown> = {
        connection: {
          reconnect: true,
          secure: true,
        },
        channels: normalizedChannelNames,
      };

      if (useAuth && auth?.username && auth?.accessToken) {
        options.identity = {
          username: auth.username,
          password: normalizeOAuthToken(auth.accessToken),
        };
      }

      const client: TwitchClientLike = new tmi.Client(options);
      this.client = client;

      client.on(
        "message",
        (
          channel: string,
          userstate: TwitchUserState,
          messageText: string,
          self: boolean
        ) => {
          if (self) {
            return;
          }

          const channelName = normalizeChannelName(channel);
          const authorName =
            userstate["display-name"] || userstate.username || "unknown";

          this.onMessage({
            id: userstate.id || createMessageId(),
            platform: "twitch",
            channelName,
            authorName,
            text: messageText,
            timestamp: Date.now(),
          });
        }
      );

      client.on("connected", () => {
        this.status = {
          connected: true,
          channelNames: normalizedChannelNames,
          error: null,
          authenticated: useAuth,
          username: useAuth ? auth?.username ?? null : null,
        };
      });

      client.on("disconnected", (reason: string) => {
        this.status = {
          connected: false,
          channelNames: normalizedChannelNames,
          error: reason || "Twitch отключён",
          authenticated: useAuth,
          username: useAuth ? auth?.username ?? null : null,
        };
      });

      await client.connect();

      this.status = {
        connected: true,
        channelNames: normalizedChannelNames,
        error: null,
        authenticated: useAuth,
        username: useAuth ? auth?.username ?? null : null,
      };

      return this.status;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Ошибка подключения Twitch";

      this.status = {
        connected: false,
        channelNames: normalizedChannelNames,
        error: errorMessage,
        authenticated: useAuth,
        username: useAuth ? auth?.username ?? null : null,
      };

      return this.status;
    }
  }

  async disconnect() {
    const client = this.client;

    if (!client) {
      this.status = {
        connected: false,
        channelNames: [],
        error: null,
        authenticated: false,
        username: null,
      };

      return this.status;
    }

    try {
      await client.disconnect();
    } catch {
      // tmi.js может ругнуться, если клиент уже отключён.
    }

    this.client = null;

    this.status = {
      connected: false,
      channelNames: [],
      error: null,
      authenticated: false,
      username: null,
    };

    return this.status;
  }
}