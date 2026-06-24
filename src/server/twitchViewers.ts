import type {
  ChatSource,
  TwitchAuthState,
  TwitchViewersStatus,
} from "../shared/types";

function normalizeTwitchChannelName(channelName: string) {
  return channelName.trim().replace(/^#/, "").replace(/^@/, "").toLowerCase();
}

function getEnabledTwitchChannelNames(
  sources: ChatSource[],
  ownChannelName?: string | null
) {
  const names = sources
    .filter((source) => source.enabled && source.platform === "twitch")
    .map((source) => normalizeTwitchChannelName(source.channelName))
    .filter(Boolean);

  const ownChannel = normalizeTwitchChannelName(ownChannelName || "");

  if (ownChannel) {
    names.push(ownChannel);
  }

  return [...new Set(names)];
}

export async function getTwitchViewersStatus({
  sources,
  auth,
  clientId,
}: {
  sources: ChatSource[];
  auth: TwitchAuthState;
  clientId: string;
}): Promise<TwitchViewersStatus> {
  const channelNames = getEnabledTwitchChannelNames(
    sources,
    auth.username
  );

  if (channelNames.length === 0) {
    return {
      totalViewers: 0,
      channels: [],
      error: null,
    };
  }

  if (!auth.enabled || !auth.accessToken) {
    return {
      totalViewers: 0,
      channels: channelNames.map((channelName) => ({
        channelName,
        viewerCount: 0,
        live: false,
        error: "Требуется Twitch Login",
      })),
      error: "Требуется Twitch Login",
    };
  }

  const params = new URLSearchParams();

  for (const channelName of channelNames) {
    params.append("user_login", channelName);
  }

  try {
    const response = await fetch(
      `https://api.twitch.tv/helix/streams?${params.toString()}`,
      {
        headers: {
          "Client-ID": clientId,
          Authorization: `Bearer ${auth.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const text = await response.text().catch(() => "");

      return {
        totalViewers: 0,
        channels: channelNames.map((channelName) => ({
          channelName,
          viewerCount: 0,
          live: false,
          error: `Twitch API error ${response.status}: ${text}`,
        })),
        error: `Twitch API error ${response.status}`,
      };
    }

    const data = (await response.json()) as {
      data?: Array<{
        user_login: string;
        viewer_count: number;
      }>;
    };

    const liveMap = new Map(
      (data.data || []).map((stream) => [
        stream.user_login.toLowerCase(),
        stream.viewer_count,
      ])
    );

    const channels = channelNames.map((channelName) => {
      const viewerCount = liveMap.get(channelName) ?? 0;

      return {
        channelName,
        viewerCount,
        live: liveMap.has(channelName),
        error: null,
      };
    });

    return {
      totalViewers: channels.reduce(
        (sum, channel) => sum + channel.viewerCount,
        0
      ),
      channels,
      error: null,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Ошибка Twitch viewers";

    return {
      totalViewers: 0,
      channels: channelNames.map((channelName) => ({
        channelName,
        viewerCount: 0,
        live: false,
        error: errorMessage,
      })),
      error: errorMessage,
    };
  }
}