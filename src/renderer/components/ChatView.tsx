import type { RefObject } from "react";
import type { ChatMessage } from "../../shared/types";
import { getPlatformClassName, getPlatformIcon } from "../utils/chat";

type ChatViewProps = {
  messages: ChatMessage[];
  messagesEndRef: RefObject<HTMLDivElement | null>;
  t: (key: string) => string;
  clearMessages: () => void;
  chatOnlyMode: boolean;
  onToggleChatOnlyMode: () => void;
};

export function ChatView({
  messages,
  messagesEndRef,
  t,
  clearMessages,
  chatOnlyMode,
  onToggleChatOnlyMode,
}: ChatViewProps) {
  return (
    <section className="chat">
      <header className="chatHeader">
        <div>
          <h2>{t("commonChat")}</h2>
          <span>
            {messages.length} {t("messages")}
          </span>
        </div>

        <div className="chatHeaderButtons">
          <button
            className="smallButton secondaryButton"
            type="button"
            onClick={onToggleChatOnlyMode}
          >
            {chatOnlyMode ? "Показать настройки" : "Только чат"}
          </button>

          <button className="smallButton" type="button" onClick={clearMessages}>
            {t("clear")}
          </button>
        </div>
      </header>

      <div className="messages">
        {messages.map((message) => (
          <article key={message.id} className="message">
            <span className={getPlatformClassName(message.platform)}>
              {getPlatformIcon(message.platform)}
            </span>

            <div>
              <div className="meta">
                <strong>{message.authorName}</strong>
                <span>#{message.channelName}</span>
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