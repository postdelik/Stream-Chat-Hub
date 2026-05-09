import { randomUUID } from "crypto";
import type { ChatMessage } from "../shared/types";
import type { MessageHub } from "./messageHub";

const AUTHORS = [
  "StreamKnight",
  "PixelFox",
  "NightViewer",
  "CodeGoblin",
  "КефирныйМаг",
  "ЛамповыйЧатер",
];

const TEXTS = [
  "Привет всем!",
  "OBS уже подключён?",
  "Это Twitch или YouTube?",
  "Когда начало?",
  "Можно ссылку?",
  "Звук нормальный?",
  "help",
  "Хороший стрим!",
];

export function startMockChat(messageHub: MessageHub) {
  const timer = setInterval(() => {
    const platform = Math.random() > 0.5 ? "twitch" : "youtube";
    const authorName = AUTHORS[Math.floor(Math.random() * AUTHORS.length)];
    const text = TEXTS[Math.floor(Math.random() * TEXTS.length)];

    const message: ChatMessage = {
      id: randomUUID(),
      platform,
      channelName: platform === "twitch" ? "Mock Twitch" : "Mock YouTube",
      authorName,
      text,
      timestamp: Date.now(),
    };

    messageHub.addMessage(message);
  }, 1200);

  return () => {
    clearInterval(timer);
  };
}