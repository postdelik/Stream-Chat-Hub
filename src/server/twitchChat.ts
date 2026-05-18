import type {
  ChatMessage,
  ChatMessageEmote,
  TwitchAuthState,
  TwitchConnectionStatus,
} from "../shared/types";

const tmi = require("tmi.js");

type TwitchUserState = {
  username?: string;
  "display-name"?: string;
  badges?: Record<string, string>;
  id?: string;
  emotes?: Record<string, string[]> | null;
};

type TwitchClientLike = {
  connect: () => Promise<[string, number]>;
  disconnect: () => Promise<[string, number]>;
  on: (eventName: string, callback: (...args: any[]) => void) => void;
};

function createMessageId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createAnonymousUsername() {
  return `justinfan${Math.floor(Math.random() * 100000)}`;
}

function normalizeChannelName(channelName: string) {
  return channelName
    .trim()
    .replace(/^#/, "")
    .replace(/^@/, "")
    .toLowerCase();
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

function getTwitchEmoteUrl(emoteId: string) {
  return `https://static-cdn.jtvnw.net/emoticons/v2/${emoteId}/default/dark/2.0`;
}

function parseTwitchEmotes(
  messageText: string,
  userstate: TwitchUserState
): ChatMessageEmote[] {
  const emotes = userstate.emotes;

  if (!emotes) {
    return [];
  }

  const parsedEmotes: ChatMessageEmote[] = [];

  for (const [emoteId, positions] of Object.entries(emotes)) {
    for (const position of positions) {
      const [startRaw, endRaw] = position.split("-");
      const start = Number.parseInt(startRaw, 10);
      const end = Number.parseInt(endRaw, 10);

      if (!Number.isFinite(start) || !Number.isFinite(end)) {
        continue;
      }

      const name = messageText.slice(start, end + 1);

      parsedEmotes.push({
        id: emoteId,
        name,
        start,
        end,
        url: getTwitchEmoteUrl(emoteId),
        platform: "twitch",
      });
    }
  }

  return parsedEmotes.sort((a, b) => a.start - b.start);
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

    if (normalizedChannelNames.length === 0) {
      this.status = {
        connected: false,
        channelNames: [],
        error: "Нет Twitch-каналов для подключения",
        authenticated: false,
        username: null,
      };

      return this.status;
    }

    const useAuth = Boolean(auth?.enabled && auth.username && auth.accessToken);

    const identity = useAuth
      ? {
          username: auth!.username!,
          password: normalizeOAuthToken(auth!.accessToken!),
        }
      : {
          username: createAnonymousUsername(),
          password: "SCHMOOPIIE",
        };

    try {
      const options = {
        options: {
          debug: true,
        },

        connection: {
          reconnect: true,
          secure: true,
        },

        identity,

        channels: normalizedChannelNames,
      };

      console.log("[TWITCH] Подключение...");
      console.log("[TWITCH] Каналы:", normalizedChannelNames);
      console.log("[TWITCH] Auth mode:", useAuth ? "oauth" : "anonymous");
      console.log("[TWITCH] Username:", identity.username);

      const client: TwitchClientLike = new tmi.Client(options);

      this.client = client;

      client.on("connected", (address: string, port: number) => {
        console.log("[TWITCH CONNECTED]", address, port);

        this.status = {
          connected: true,
          channelNames: normalizedChannelNames,
          error: null,
          authenticated: useAuth,
          username: useAuth ? auth?.username ?? null : identity.username,
        };
      });

      client.on("disconnected", (reason: string) => {
        console.error("[TWITCH DISCONNECTED]", reason);

        this.status = {
          connected: false,
          channelNames: normalizedChannelNames,
          error: reason || "Twitch отключён",
          authenticated: useAuth,
          username: useAuth ? auth?.username ?? null : identity.username,
        };
      });

      client.on(
        "notice",
        (channel: string, msgid: string, message: string) => {
          console.error("[TWITCH NOTICE]", {
            channel,
            msgid,
            message,
          });
        }
      );

      client.on("reconnect", () => {
        console.warn("[TWITCH] Reconnecting...");
      });

      client.on("join", (channel: string, username: string) => {
        console.log("[TWITCH JOIN]", channel, username);
      });

      client.on("part", (channel: string, username: string) => {
        console.log("[TWITCH PART]", channel, username);
      });

      client.on("roomstate", (channel: string, state: unknown) => {
        console.log("[TWITCH ROOMSTATE]", channel, state);
      });

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

          const emotes = parseTwitchEmotes(messageText, userstate);

          console.log(
            `[TWITCH MESSAGE] #${channelName} ${authorName}: ${messageText}`
          );

          this.onMessage({
            id: userstate.id || createMessageId(),
            platform: "twitch",
            channelName,
            authorName,
            text: messageText,
            timestamp: Date.now(),
            emotes,
          });
        }
      );

      await client.connect();

      console.log("[TWITCH] connect() completed");

      this.status = {
        connected: true,
        channelNames: normalizedChannelNames,
        error: null,
        authenticated: useAuth,
        username: useAuth ? auth?.username ?? null : identity.username,
      };

      return this.status;
    } catch (error) {
      console.error("[TWITCH ERROR]", error);

      const errorMessage =
        error instanceof Error ? error.message : "Ошибка подключения Twitch";

      this.status = {
        connected: false,
        channelNames: normalizedChannelNames,
        error: errorMessage,
        authenticated: useAuth,
        username: useAuth ? auth?.username ?? null : identity.username,
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
      console.log("[TWITCH] Disconnecting...");
      await client.disconnect();
    } catch (error) {
      console.warn("[TWITCH] disconnect warning", error);
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