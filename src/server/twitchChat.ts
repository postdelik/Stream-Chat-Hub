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
  "room-id"?: string;
  "source-room-id"?: string;
};

type TwitchClientLike = {
  connect: () => Promise<[string, number]>;
  disconnect: () => Promise<[string, number]>;
  on: (eventName: string, callback: (...args: any[]) => void) => void;
};

type TwitchHelixUser = {
  id: string;
  login: string;
  display_name: string;
};

type ThirdPartyEmoteDefinition = {
  id: string;
  name: string;
  url: string;
};

type SevenTvHostFile = {
  name?: string;
  format?: string;
  width?: number;
  height?: number;
};

type SevenTvEmote = {
  id?: string;
  name?: string;
  data?: {
    host?: {
      url?: string;
      files?: SevenTvHostFile[];
    };
  };
};

type BetterTtvEmote = {
  id?: string;
  code?: string;
  imageType?: string;
  animated?: boolean;
};

type FrankerFaceZEmote = {
  id?: number | string;
  name?: string;
  urls?: Record<string, string>;
};

const THIRD_PARTY_CACHE_TTL_MS = 30 * 60 * 1000;
const THIRD_PARTY_REQUEST_TIMEOUT_MS = 7000;

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

function getBearerToken(token: string | null | undefined) {
  return (token || "").trim().replace(/^oauth:/i, "");
}

function normalizeCdnUrl(url: string | null | undefined) {
  const value = String(url || "").trim();

  if (!value) {
    return "";
  }

  if (value.startsWith("//")) {
    return `https:${value}`;
  }

  return value;
}

function getTwitchEmoteUrl(emoteId: string) {
  return `https://static-cdn.jtvnw.net/emoticons/v2/${emoteId}/default/dark/2.0`;
}

async function fetchJson<T>(url: string): Promise<T | null> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    THIRD_PARTY_REQUEST_TIMEOUT_MS
  );

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Stream-Chat-Hub",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
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

function chooseSevenTvFile(files: SevenTvHostFile[] | undefined) {
  if (!Array.isArray(files) || files.length === 0) {
    return null;
  }

  return (
    files.find((file) => file.name === "2x.webp") ||
    files.find((file) => file.name === "1x.webp") ||
    files.find((file) => file.format === "WEBP") ||
    files[0]
  );
}

function parseSevenTvEmotes(
  emotes: SevenTvEmote[] | undefined
): Map<string, ThirdPartyEmoteDefinition> {
  const result = new Map<string, ThirdPartyEmoteDefinition>();

  for (const emote of emotes || []) {
    const id = String(emote.id || "").trim();
    const name = String(emote.name || "").trim();
    const hostUrl = normalizeCdnUrl(emote.data?.host?.url);
    const file = chooseSevenTvFile(emote.data?.host?.files);
    const fileName = String(file?.name || "").trim();

    if (!id || !name || !hostUrl || !fileName) {
      continue;
    }

    result.set(name, {
      id: `7tv:${id}`,
      name,
      url: `${hostUrl}/${fileName}`,
    });
  }

  return result;
}

function parseBetterTtvEmotes(
  emotes: BetterTtvEmote[] | undefined
): Map<string, ThirdPartyEmoteDefinition> {
  const result = new Map<string, ThirdPartyEmoteDefinition>();

  for (const emote of emotes || []) {
    const id = String(emote.id || "").trim();
    const name = String(emote.code || "").trim();

    if (!id || !name) {
      continue;
    }

    result.set(name, {
      id: `bttv:${id}`,
      name,
      url: `https://cdn.betterttv.net/emote/${id}/2x`,
    });
  }

  return result;
}

function parseFrankerFaceZSets(
  sets: Record<string, { emoticons?: FrankerFaceZEmote[] }> | undefined,
  allowedSetIds?: Array<string | number>
): Map<string, ThirdPartyEmoteDefinition> {
  const result = new Map<string, ThirdPartyEmoteDefinition>();
  const allowed = allowedSetIds
    ? new Set(allowedSetIds.map((setId) => String(setId)))
    : null;

  for (const [setId, set] of Object.entries(sets || {})) {
    if (allowed && !allowed.has(String(setId))) {
      continue;
    }

    for (const emote of set.emoticons || []) {
      const id = String(emote.id || "").trim();
      const name = String(emote.name || "").trim();
      const rawUrl =
        emote.urls?.["2"] || emote.urls?.["4"] || emote.urls?.["1"] || "";
      const url = normalizeCdnUrl(rawUrl);

      if (!id || !name || !url) {
        continue;
      }

      result.set(name, {
        id: `ffz:${id}`,
        name,
        url,
      });
    }
  }

  return result;
}

function mergeEmoteMaps(
  ...maps: Array<Map<string, ThirdPartyEmoteDefinition>>
) {
  const result = new Map<string, ThirdPartyEmoteDefinition>();

  for (const map of maps) {
    for (const [name, emote] of map) {
      result.set(name, emote);
    }
  }

  return result;
}

function overlapsExistingEmote(
  start: number,
  end: number,
  emotes: ChatMessageEmote[]
) {
  return emotes.some(
    (emote) => start <= emote.end && end >= emote.start
  );
}

function parseThirdPartyEmotes(
  messageText: string,
  definitions: Map<string, ThirdPartyEmoteDefinition>,
  existingEmotes: ChatMessageEmote[]
): ChatMessageEmote[] {
  const result: ChatMessageEmote[] = [];
  const tokenRegex = /\S+/g;

  for (const match of messageText.matchAll(tokenRegex)) {
    const name = match[0];
    const start = match.index ?? -1;
    const definition = definitions.get(name);

    if (!definition || start < 0) {
      continue;
    }

    const end = start + name.length - 1;

    if (
      overlapsExistingEmote(start, end, existingEmotes) ||
      overlapsExistingEmote(start, end, result)
    ) {
      continue;
    }

    result.push({
      id: definition.id,
      name: definition.name,
      start,
      end,
      url: definition.url,
      platform: "thirdParty",
    });
  }

  return result;
}

export class TwitchChatClient {
  private client: TwitchClientLike | null = null;

  private readonly roomNameCache = new Map<string, string>();

  private readonly roomNameRequests = new Map<string, Promise<string | null>>();

  private readonly roomEmoteCache = new Map<
    string,
    {
      expiresAt: number;
      emotes: Map<string, ThirdPartyEmoteDefinition>;
    }
  >();

  private readonly roomEmoteRequests = new Map<
    string,
    Promise<Map<string, ThirdPartyEmoteDefinition>>
  >();

  private globalEmoteCache: {
    expiresAt: number;
    emotes: Map<string, ThirdPartyEmoteDefinition>;
  } | null = null;

  private globalEmoteRequest:
    | Promise<Map<string, ThirdPartyEmoteDefinition>>
    | null = null;

  private currentAuth: TwitchAuthState | null = null;

  private status: TwitchConnectionStatus = {
    connected: false,
    channelNames: [],
    error: null,
    authenticated: false,
    username: null,
  };

  constructor(
    private readonly onMessage: (message: ChatMessage) => void,
    private readonly twitchClientId: string
  ) {}

  getStatus() {
    return this.status;
  }

  private async resolveRoomName(roomId: string): Promise<string | null> {
    const cachedName = this.roomNameCache.get(roomId);

    if (cachedName) {
      return cachedName;
    }

    const existingRequest = this.roomNameRequests.get(roomId);

    if (existingRequest) {
      return existingRequest;
    }

    const accessToken = getBearerToken(this.currentAuth?.accessToken);

    if (!accessToken || !this.twitchClientId) {
      return null;
    }

    const request = (async () => {
      try {
        const response = await fetch(
          `https://api.twitch.tv/helix/users?id=${encodeURIComponent(roomId)}`,
          {
            headers: {
              "Client-Id": this.twitchClientId,
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!response.ok) {
          console.warn("[TWITCH SHARED CHAT] Helix request failed", {
            roomId,
            status: response.status,
          });
          return null;
        }

        const payload = (await response.json()) as {
          data?: TwitchHelixUser[];
        };

        const user = payload.data?.[0];
        const channelName = user?.login
          ? normalizeChannelName(user.login)
          : null;

        if (channelName) {
          this.roomNameCache.set(roomId, channelName);
        }

        return channelName;
      } catch (error) {
        console.warn("[TWITCH SHARED CHAT] Failed to resolve source room", {
          roomId,
          error: error instanceof Error ? error.message : String(error),
        });
        return null;
      } finally {
        this.roomNameRequests.delete(roomId);
      }
    })();

    this.roomNameRequests.set(roomId, request);
    return request;
  }

  private async loadGlobalThirdPartyEmotes() {
    if (
      this.globalEmoteCache &&
      this.globalEmoteCache.expiresAt > Date.now()
    ) {
      return this.globalEmoteCache.emotes;
    }

    if (this.globalEmoteRequest) {
      return this.globalEmoteRequest;
    }

    this.globalEmoteRequest = (async () => {
      const [sevenTvPayload, betterTtvPayload, ffzPayload] = await Promise.all([
        fetchJson<{ emotes?: SevenTvEmote[] }>(
          "https://7tv.io/v3/emote-sets/global"
        ),
        fetchJson<BetterTtvEmote[]>(
          "https://api.betterttv.net/3/cached/emotes/global"
        ),
        fetchJson<{
          default_sets?: Array<string | number>;
          sets?: Record<string, { emoticons?: FrankerFaceZEmote[] }>;
        }>("https://api.frankerfacez.com/v1/set/global"),
      ]);

      const emotes = mergeEmoteMaps(
        parseFrankerFaceZSets(
          ffzPayload?.sets,
          ffzPayload?.default_sets
        ),
        parseBetterTtvEmotes(betterTtvPayload || []),
        parseSevenTvEmotes(sevenTvPayload?.emotes)
      );

      this.globalEmoteCache = {
        expiresAt: Date.now() + THIRD_PARTY_CACHE_TTL_MS,
        emotes,
      };

      console.log("[TWITCH EMOTES] Global third-party emotes loaded", {
        count: emotes.size,
      });

      return emotes;
    })().finally(() => {
      this.globalEmoteRequest = null;
    });

    return this.globalEmoteRequest;
  }

  private async loadRoomThirdPartyEmotes(roomId: string) {
    if (!roomId) {
      return new Map<string, ThirdPartyEmoteDefinition>();
    }

    const cached = this.roomEmoteCache.get(roomId);

    if (cached && cached.expiresAt > Date.now()) {
      return cached.emotes;
    }

    const existingRequest = this.roomEmoteRequests.get(roomId);

    if (existingRequest) {
      return existingRequest;
    }

    const request = (async () => {
      const [sevenTvPayload, betterTtvPayload, ffzPayload] = await Promise.all([
        fetchJson<{
          emote_set?: {
            emotes?: SevenTvEmote[];
          };
        }>(`https://7tv.io/v3/users/twitch/${encodeURIComponent(roomId)}`),
        fetchJson<{
          channelEmotes?: BetterTtvEmote[];
          sharedEmotes?: BetterTtvEmote[];
        }>(
          `https://api.betterttv.net/3/cached/users/twitch/${encodeURIComponent(
            roomId
          )}`
        ),
        fetchJson<{
          room?: {
            set?: string | number;
          };
          sets?: Record<string, { emoticons?: FrankerFaceZEmote[] }>;
        }>(
          `https://api.frankerfacez.com/v1/room/id/${encodeURIComponent(roomId)}`
        ),
      ]);

      const emotes = mergeEmoteMaps(
        parseFrankerFaceZSets(
          ffzPayload?.sets,
          ffzPayload?.room?.set != null ? [ffzPayload.room.set] : undefined
        ),
        parseBetterTtvEmotes([
          ...(betterTtvPayload?.sharedEmotes || []),
          ...(betterTtvPayload?.channelEmotes || []),
        ]),
        parseSevenTvEmotes(sevenTvPayload?.emote_set?.emotes)
      );

      this.roomEmoteCache.set(roomId, {
        expiresAt: Date.now() + THIRD_PARTY_CACHE_TTL_MS,
        emotes,
      });

      console.log("[TWITCH EMOTES] Channel third-party emotes loaded", {
        roomId,
        count: emotes.size,
      });

      return emotes;
    })().finally(() => {
      this.roomEmoteRequests.delete(roomId);
    });

    this.roomEmoteRequests.set(roomId, request);
    return request;
  }

  private async getThirdPartyEmotes(roomId: string) {
    const [globalEmotes, roomEmotes] = await Promise.all([
      this.loadGlobalThirdPartyEmotes(),
      this.loadRoomThirdPartyEmotes(roomId),
    ]);

    return mergeEmoteMaps(globalEmotes, roomEmotes);
  }

  async connect(channelNames: string[], auth?: TwitchAuthState | null) {
    await this.disconnect();

    this.currentAuth = auth || null;

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
        async (
          channel: string,
          userstate: TwitchUserState,
          messageText: string,
          self: boolean
        ) => {
          if (self) {
            return;
          }

          const receivingChannelName = normalizeChannelName(channel);
          const roomId = userstate["room-id"] || "";
          const sourceRoomId = userstate["source-room-id"] || "";
          const isSharedChat = Boolean(
            sourceRoomId && (!roomId || sourceRoomId !== roomId)
          );

          const effectiveRoomId = isSharedChat ? sourceRoomId : roomId;

          let channelName = receivingChannelName;

          if (isSharedChat) {
            const resolvedSourceChannelName = await this.resolveRoomName(
              sourceRoomId
            );

            channelName = resolvedSourceChannelName || "Shared Chat";
          }

          const authorName =
            userstate["display-name"] || userstate.username || "unknown";

          const nativeEmotes = parseTwitchEmotes(messageText, userstate);
          const thirdPartyDefinitions =
            await this.getThirdPartyEmotes(effectiveRoomId);
          const thirdPartyEmotes = parseThirdPartyEmotes(
            messageText,
            thirdPartyDefinitions,
            nativeEmotes
          );
          const emotes = [...nativeEmotes, ...thirdPartyEmotes].sort(
            (a, b) => a.start - b.start
          );

          console.log(
            `[TWITCH MESSAGE] #${channelName} ${authorName}: ${messageText}`,
            {
              nativeEmotes: nativeEmotes.length,
              thirdPartyEmotes: thirdPartyEmotes.length,
              isSharedChat,
              receivingChannelName,
              roomId,
              sourceRoomId,
            }
          );

          this.onMessage({
            id: userstate.id || createMessageId(),
            platform: "twitch",
            channelName,
            authorName,
            text: messageText,
            timestamp: Date.now(),
            emotes,
            isSharedChat,
            sourceChannelId: isSharedChat ? sourceRoomId : undefined,
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
      this.currentAuth = null;

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
    this.currentAuth = null;

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
