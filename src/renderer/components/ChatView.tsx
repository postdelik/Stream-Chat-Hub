import type { RefObject } from "react";
import type { ChatMessage, TwitchViewersStatus } from "../../shared/types";
import { getPlatformClassName, getPlatformIcon } from "../utils/chat";

type ChatViewProps = {
  messages: ChatMessage[];
  messagesEndRef: RefObject<HTMLDivElement | null>;
  t: (key: string) => string;
  clearMessages: () => void;
  chatOnlyMode: boolean;
  onToggleChatOnlyMode: () => void;
  twitchViewersStatus: TwitchViewersStatus;
};

function formatViewerCount(value: number) {
  return new Intl.NumberFormat("ru-RU").format(value);
}

export function ChatView({
  messages,
  messagesEndRef,
  t,
  clearMessages,
  chatOnlyMode,
  onToggleChatOnlyMode,
  twitchViewersStatus,
}: ChatViewProps) {
  return (
    <section className="chat">
      <header className="chatHeader">
        <div>
          <h2>{t("chatTitle")}</h2>
          <span>
            {messages.length} {t("messages")}
          </span>
        </div>

        <div className="chatHeaderButtons">
          <div
            className={
              twitchViewersStatus.error
                ? "viewerCounter viewerCounterError"
                : "viewerCounter"
            }
            title={
              twitchViewersStatus.error ||
              twitchViewersStatus.channels
                .map((channel) =>
                  channel.live
                    ? `#${channel.channelName}: ${channel.viewerCount}`
                    : `#${channel.channelName}: offline`
                )
                .join("\n") ||
              "Нет подключённых Twitch-каналов"
            }
          >
            <span>👁</span>
            <strong>{formatViewerCount(twitchViewersStatus.totalViewers)}</strong>
          </div>

          <button
            className="smallButton secondaryButton"
            type="button"
            onClick={clearMessages}
          >
            {t("clearChat")}
          </button>

          <button
            className="smallButton"
            type="button"
            onClick={onToggleChatOnlyMode}
          >
            {chatOnlyMode ? t("showSettings") : t("chatOnlyMode")}
          </button>
        </div>
      </header>

      <div className="messages">
        {messages.map((message) => (
          <article className="message" key={message.id}>
            <span
              className={`platform ${getPlatformClassName(message.platform)}`}
            >
              {getPlatformIcon(message.platform)}
            </span>

            <div>
              <div className="meta">
                <strong>{message.authorName}</strong>
                <span>#{message.channelName}</span>
                <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
              </div>

              <p>{message.text}</p>
            </div>
          </article>
        ))}

        <div ref={messagesEndRef} />
      </div>
    </section>
  );
}