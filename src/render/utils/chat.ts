import type { ChatMessage, ChatSource } from "../../shared/types";

export function getPlatformIcon(platform: ChatMessage["platform"]) {
  if (platform === "twitch") return "T";
  if (platform === "youtube") return "Y";
  return "M";
}

export function getPlatformClassName(platform: ChatMessage["platform"]) {
  if (platform === "twitch") return "platform twitchPlatform";
  if (platform === "youtube") return "platform youtubePlatform";
  return "platform mockPlatform";
}

export function getSourcePlatformLabel(platform: ChatSource["platform"]) {
  if (platform === "twitch") return "Twitch";
  return "YouTube";
}

export function normalizeTwitchChannelName(channelName: string) {
  return channelName.trim().replace(/^#/, "").replace(/^@/, "").toLowerCase();
}

export function normalizeYouTubeInput(channelName: string) {
  return channelName.trim();
}

export function normalizeSourceInput(platform: ChatSource["platform"], input: string) {
  if (platform === "twitch") {
    return normalizeTwitchChannelName(input);
  }

  return normalizeYouTubeInput(input);
}

export function createSourceId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
