import type { ChatMessage, ChatSource } from "../../shared/types";

export function getPlatformIcon(platform: ChatMessage["platform"]) {
  if (platform === "twitch") return "T";
  return "M";
}

export function getPlatformClassName(platform: ChatMessage["platform"]) {
  if (platform === "twitch") return "platform twitchPlatform";
  return "platform mockPlatform";
}

export function getSourcePlatformLabel(platform: ChatSource["platform"]) {
  return "Twitch";
}

export function normalizeTwitchChannelName(channelName: string) {
  return channelName.trim().replace(/^#/, "").replace(/^@/, "").toLowerCase();
}

export function normalizeSourceInput(_platform: ChatSource["platform"], input: string) {
  return normalizeTwitchChannelName(input);
}

export function createSourceId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
