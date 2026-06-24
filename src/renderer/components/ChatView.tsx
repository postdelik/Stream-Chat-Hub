import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import type {
  AppChatAppearanceSettings,
  ChatMessage,
  ChatMessageEmote,
  OverlaySettings,
  OwnStreamStatus,
} from "../../shared/types";
import { getPlatformClassName, getPlatformIcon } from "../utils/chat";

type ChatViewProps = {
  messages: ChatMessage[];
  messagesEndRef: RefObject<HTMLDivElement | null>;
  t: (key: string) => string;
  clearMessages: () => void;
  chatOnlyMode: boolean;
  onToggleChatOnlyMode: () => void;
  ownStreamStatuses: OwnStreamStatus[];
  showViewerCounter: boolean;
  viewerCount: number;
  filterHighlightWords: string;
  overlaySettings: OverlaySettings;
  appAppearance: AppChatAppearanceSettings;
};


function getEmoteProviderLabel(emote: ChatMessageEmote) {
  switch (emote.provider) {
    case "7tv":
      return "7TV";
    case "bttv":
      return "BetterTTV";
    case "ffz":
      return "FrankerFaceZ";
    case "youtube":
      return "YouTube";
    case "twitch":
    default:
      return "Twitch";
  }
}

type EmoteImageProps = {
  emote: ChatMessageEmote;
};

function EmoteImage({ emote }: EmoteImageProps) {
  const [failed, setFailed] = useState(false);
  const providerLabel = getEmoteProviderLabel(emote);
  const title = `${emote.name} · ${providerLabel}`;

  if (failed) {
    return (
      <span className="chatEmoteFallback" title={title}>
        {emote.name}
      </span>
    );
  }

  return (
    <img
      className="chatEmote"
      src={emote.url}
      alt={emote.name}
      title={title}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

function getOwnStreamStatusLabel(
  status: OwnStreamStatus,
  t: (key: string) => string
) {
  switch (status.state) {
    case "checking":
      return t("streamStatusChecking");
    case "live":
      return t("streamStatusLive");
    case "offline":
      return t("streamStatusOffline");
    case "error":
    default:
      return status.error || t("streamStatusError");
  }
}

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
      <EmoteImage
        key={`emote-${emote.id}-${emote.start}-${index}`}
        emote={emote}
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

  const opacity =
    Math.max(0, Math.min(100, overlay.backgroundOpacity)) / 100;

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
  const baseStyle = {
    gap: `${Math.max(0, Math.min(40, overlay.messageGap))}px`,
  };

  if (!overlay.showStyleInApp) {
    return baseStyle;
  }

  const opacity =
    Math.max(0, Math.min(100, overlay.backgroundOpacity)) / 100;

  if (overlay.styleMode === "containerBubble") {
    return {
      ...baseStyle,
      background: hexToRgba(overlay.backgroundColor, opacity),
      borderRadius: `${overlay.borderRadius}px`,
      fontFamily: overlay.fontFamily,
    };
  }

  return {
    ...baseStyle,
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

function getEffectiveAppOverlay(
  overlay: OverlaySettings,
  appAppearance: AppChatAppearanceSettings
): OverlaySettings {
  if (appAppearance.useOverlaySettings) {
    return {
      ...overlay,
      showStyleInApp: true,
      showPlatformIcon: true,
    };
  }

  return {
    ...overlay,
    fontSize: appAppearance.fontSize,
    fontFamily: appAppearance.fontFamily,
    messageGap: appAppearance.messageGap,
    backgroundOpacity: appAppearance.backgroundOpacity,
    backgroundColor: appAppearance.backgroundColor,
    borderRadius: appAppearance.borderRadius,
    showPlatformIcon: appAppearance.showPlatformIcon,
    showChannelName: appAppearance.showChannelName,
    showAuthorName: appAppearance.showAuthorName,
    styleMode: "color",
    showStyleInApp: true,
    bubbleMediaUrl: "",
    bubbleMediaType: "none",
  };
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
  ownStreamStatuses,
  showViewerCounter,
  viewerCount,
  filterHighlightWords,
  overlaySettings,
  appAppearance,
}: ChatViewProps) {
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const isNearBottomRef = useRef(true);
  const previousMessageCountRef = useRef(messages.length);
  const [newMessagesCount, setNewMessagesCount] = useState(0);

  const effectiveOverlay = getEffectiveAppOverlay(
    overlaySettings,
    appAppearance
  );

  const showContainerMedia =
    appAppearance.useOverlaySettings &&
    effectiveOverlay.styleMode === "containerBubble";

  const showMessageMedia =
    appAppearance.useOverlaySettings &&
    effectiveOverlay.styleMode === "messageBubble";

  const messagesClassName = [
    "messages",
    chatOnlyMode ? "chatOnlyMessages" : "",
    appAppearance.useOverlaySettings &&
    effectiveOverlay.styleMode === "containerBubble"
      ? "appStyledChat"
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  useEffect(() => {
    const previousCount = previousMessageCountRef.current;
    const addedMessages = Math.max(0, messages.length - previousCount);
    previousMessageCountRef.current = messages.length;

    if (isNearBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({
        behavior: previousCount === 0 ? "auto" : "smooth",
        block: "end",
      });
      setNewMessagesCount(0);
      return;
    }

    if (addedMessages > 0) {
      setNewMessagesCount((current) => current + addedMessages);
    }
  }, [messages, messagesEndRef]);

  function handleMessagesScroll() {
    const element = messagesContainerRef.current;

    if (!element) {
      return;
    }

    const distanceFromBottom =
      element.scrollHeight - element.scrollTop - element.clientHeight;

    const nearBottom = distanceFromBottom <= 40;
    isNearBottomRef.current = nearBottom;

    if (nearBottom) {
      setNewMessagesCount(0);
    }
  }

  function scrollToNewestMessages() {
    isNearBottomRef.current = true;
    setNewMessagesCount(0);

    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }

  return (
    <section className={chatOnlyMode ? "chat chatOnlyView" : "chat"}>
      <header className="chatHeader" data-tour-id="tour-chat">
        <div className="chatHeaderInfo">
          <div className="chatTitleRow">
            <h2>{t("chatTitle")}</h2>

            {ownStreamStatuses.length > 0 && (
              <div className="ownStreamStatusList">
                {ownStreamStatuses.map((status) => (
                  <span
                    className={`ownStreamStatus ${status.state}`}
                    key={`${status.platform}-${status.channelName}`}
                    title={getOwnStreamStatusLabel(status, t)}
                  >
                    <span className="ownStreamStatusDot" />
                    <strong>
                      {status.platform === "twitch" ? "Twitch" : "YouTube"}
                    </strong>
                    <span>{getOwnStreamStatusLabel(status, t)}</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          <span>
            {messages.length} {t("messages")}
          </span>
        </div>

        <div className="chatHeaderButtons" data-tour-id="tour-chat-buttons">
          {showViewerCounter && (
            <div
              className="viewerCounter"
              title={t("currentViewers")}
            >
              <EyeIcon />
              <strong>{formatViewerCount(viewerCount)}</strong>
            </div>
          )}

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
        ref={messagesContainerRef}
        className={messagesClassName}
        style={getAppChatStyle(effectiveOverlay)}
        onScroll={handleMessagesScroll}
      >
        {showContainerMedia && renderAppBubbleMedia(effectiveOverlay)}

        {messages.map((message) => (
          <article
            className={[
              "message",
              chatOnlyMode ? "chatOnlyMessage" : "",
              "appStyledMessage",
              !effectiveOverlay.showPlatformIcon ? "messageWithoutPlatform" : "",
            ]
              .filter(Boolean)
              .join("\n")}
            key={message.id}
            style={getAppMessageStyle(effectiveOverlay)}
          >
            {showMessageMedia && renderAppBubbleMedia(effectiveOverlay)}

            {effectiveOverlay.showPlatformIcon && (
              <span
                className={`platform ${getPlatformClassName(message.platform)}`}
              >
                {getPlatformIcon(message.platform)}
              </span>
            )}

            <div className="appMessageContent">
              <div className="meta">
                {effectiveOverlay.showAuthorName && (
                  <strong
                    className="messageAuthor"
                    style={{ fontFamily: effectiveOverlay.fontFamily }}
                  >
                    {message.authorName}
                  </strong>
                )}

                {effectiveOverlay.showChannelName && (
                  <span className="messageChannel">
                    #{message.channelName}
                  </span>
                )}

                <time
                  className="messageTime"
                  dateTime={new Date(message.timestamp).toISOString()}
                >
                  {new Date(message.timestamp).toLocaleTimeString()}
                </time>
              </div>

              <p
                className="messageText"
                style={{
                  fontFamily: effectiveOverlay.fontFamily,
                  fontSize: `${effectiveOverlay.fontSize}px`,
                }}
              >
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

      {newMessagesCount > 0 && (
        <button
          className="newMessagesButton"
          type="button"
          onClick={scrollToNewestMessages}
        >
          ↓ {newMessagesCount} {t("newMessages")}
        </button>
      )}
    </section>
  );
}
