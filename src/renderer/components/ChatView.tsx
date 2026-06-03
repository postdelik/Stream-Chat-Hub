import type { ReactNode, RefObject } from "react";
import type {
  ChatMessage,
  ChatMessageEmote,
  OverlaySettings,
  TwitchViewersStatus,
} from "../../shared/types";
import { getPlatformClassName, getPlatformIcon } from "../utils/chat";

type ChatViewProps = {
  messages: ChatMessage[];
  messagesEndRef: RefObject<HTMLDivElement | null>;
  t: (key: string) => string;
  clearMessages: () => void;
  chatOnlyMode: boolean;
  onToggleChatOnlyMode: () => void;
  twitchViewersStatus: TwitchViewersStatus;
  filterHighlightWords: string;
  overlaySettings: OverlaySettings;
};

function formatViewerCount(value: number) {
  return new Intl.NumberFormat("ru-RU").format(value);
}

function parseHighlightWords(value: string) {
  return value
    .split(",")
    .map((word) => word.trim())
    .filter(Boolean);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function renderHighlightedText(text: string, filterHighlightWords: string) {
  const words = parseHighlightWords(filterHighlightWords);

  if (words.length === 0) {
    return text;
  }

  const regex = new RegExp(`(${words.map(escapeRegExp).join("|")})`, "gi");
  const parts = text.split(regex);

  return parts.map((part, index) => {
    const isHighlighted = words.some(
      (word) => word.toLowerCase() === part.toLowerCase()
    );

    if (!isHighlighted) {
      return <span key={`${part}-${index}`}>{part}</span>;
    }

    return (
      <span className="appHighlight" key={`${part}-${index}`}>
        {part}
      </span>
    );
  });
}

function renderTextWithHighlightsAndEmotes(
  text: string,
  emotes: ChatMessageEmote[] | undefined,
  filterHighlightWords: string
): ReactNode {
  const sortedEmotes = [...(emotes || [])]
    .filter(
      (emote) =>
        Number.isFinite(emote.start) &&
        Number.isFinite(emote.end) &&
        emote.start >= 0 &&
        emote.end >= emote.start &&
        emote.end < text.length
    )
    .sort((a, b) => a.start - b.start);

  if (sortedEmotes.length === 0) {
    return renderHighlightedText(text, filterHighlightWords);
  }

  const result: ReactNode[] = [];
  let cursor = 0;

  sortedEmotes.forEach((emote, index) => {
    if (emote.start < cursor) {
      return;
    }

    const beforeText = text.slice(cursor, emote.start);

    if (beforeText) {
      result.push(
        <span key={`text-${index}-${cursor}`}>
          {renderHighlightedText(beforeText, filterHighlightWords)}
        </span>
      );
    }

    result.push(
      <img
        className="chatEmote"
        key={`emote-${emote.id}-${emote.start}-${index}`}
        src={emote.url}
        alt={emote.name}
        title={emote.name}
        loading="lazy"
      />
    );

    cursor = emote.end + 1;
  });

  const restText = text.slice(cursor);

  if (restText) {
    result.push(
      <span key={`text-rest-${cursor}`}>
        {renderHighlightedText(restText, filterHighlightWords)}
      </span>
    );
  }

  return result;
}

function hexToRgba(hex: string, opacity: number) {
  const clean = hex.replace("#", "");

  if (!/^[0-9a-fA-F]{6}$/.test(clean)) {
    return `rgba(0, 0, 0, ${opacity})`;
  }

  const r = Number.parseInt(clean.slice(0, 2), 16);
  const g = Number.parseInt(clean.slice(2, 4), 16);
  const b = Number.parseInt(clean.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function getAppMessageStyle(overlay: OverlaySettings) {
  if (!overlay.showStyleInApp) {
    return undefined;
  }

  const opacity = Math.max(0, Math.min(100, overlay.backgroundOpacity)) / 100;

  if (overlay.styleMode === "color" || overlay.styleMode === "messageBubble") {
    return {
      background: hexToRgba(overlay.backgroundColor, opacity),
      borderRadius: `${overlay.borderRadius}px`,
      fontFamily: overlay.fontFamily,
    };
  }

  return {
    fontFamily: overlay.fontFamily,
  };
}

function getAppChatStyle(overlay: OverlaySettings) {
  if (!overlay.showStyleInApp) {
    return undefined;
  }

  const opacity = Math.max(0, Math.min(100, overlay.backgroundOpacity)) / 100;

  if (overlay.styleMode === "containerBubble") {
    return {
      background: hexToRgba(overlay.backgroundColor, opacity),
      borderRadius: `${overlay.borderRadius}px`,
      fontFamily: overlay.fontFamily,
    };
  }

  return {
    fontFamily: overlay.fontFamily,
  };
}

function renderAppBubbleMedia(overlay: OverlaySettings) {
  if (
    !overlay.showStyleInApp ||
    !overlay.bubbleMediaUrl ||
    overlay.bubbleMediaType === "none"
  ) {
    return null;
  }

  if (overlay.bubbleMediaType === "video") {
    return (
      <video
        className="appBubbleMedia"
        src={overlay.bubbleMediaUrl}
        autoPlay
        muted
        loop
        playsInline
      />
    );
  }

  return <img className="appBubbleMedia" src={overlay.bubbleMediaUrl} alt="" />;
}

function EyeIcon() {
  return (
    <svg
      className="viewerCounterIcon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.6" fill="currentColor" />
    </svg>
  );
}

export function ChatView({
  messages,
  messagesEndRef,
  t,
  clearMessages,
  chatOnlyMode,
  onToggleChatOnlyMode,
  twitchViewersStatus,
  filterHighlightWords,
  overlaySettings,
}: ChatViewProps) {
  const showContainerMedia =
    overlaySettings.showStyleInApp &&
    overlaySettings.styleMode === "containerBubble";

  const showMessageMedia =
    overlaySettings.showStyleInApp &&
    overlaySettings.styleMode === "messageBubble";

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
            <EyeIcon />
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

      <div
        className={
          overlaySettings.showStyleInApp &&
          overlaySettings.styleMode === "containerBubble"
            ? "messages appStyledChat"
            : "messages"
        }
        style={getAppChatStyle(overlaySettings)}
      >
        {showContainerMedia && renderAppBubbleMedia(overlaySettings)}

        {messages.map((message) => (
          <article
  className={
    overlaySettings.showStyleInApp
      ? "message appStyledMessage"
      : "message"
  }
  key={message.id}
  style={getAppMessageStyle(overlaySettings)}
>
            {showMessageMedia && renderAppBubbleMedia(overlaySettings)}

            <span
              className={`platform ${getPlatformClassName(message.platform)}`}
            >
              {getPlatformIcon(message.platform)}
            </span>

            <div className="appMessageContent">
              <div className="meta">
                <strong>{message.authorName}</strong>
                <span>#{message.channelName}</span>
                <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
              </div>

              <p>
                {renderTextWithHighlightsAndEmotes(
                  message.text,
                  message.emotes,
                  filterHighlightWords
                )}
              </p>
            </div>
          </article>
        ))}

        <div ref={messagesEndRef} />
      </div>
    </section>
  );
}