import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import type {
  AppSettings,
  ChatMessage,
  ChatSource,
  OverlayPosition,
  OverlaySettings,
  SafeTwitchAuthState,
  TwitchConnectionStatus,
  YouTubeConnectionStatus,
} from "../shared/types";

type CollapsibleSectionProps = {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  badge?: string;
};

type OverlayPreset = "compact" | "standard" | "large" | "textOnly";
type AddSourceTab = "anonymousTwitch" | "twitchLogin" | "youtube";

function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
  badge,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className={isOpen ? "card collapsible open" : "card collapsible"}>
      <button
        className="collapsibleHeader"
        type="button"
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className="collapseIcon">{isOpen ? "▾" : "▸"}</span>
        <span className="collapsibleTitle">{title}</span>
        {badge && <span className="sectionBadge">{badge}</span>}
      </button>

      {isOpen && <div className="collapsibleBody">{children}</div>}
    </section>
  );
}

function MiniCollapsibleSection({
  title,
  children,
  defaultOpen = false,
  badge,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className={isOpen ? "card collapsible open" : "card collapsible"}>
      <button
        className="collapsibleHeader"
        type="button"
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className="collapseIcon">{isOpen ? "▾" : "▸"}</span>
        <span className="collapsibleTitle">{title}</span>
        {badge && <span className="sectionBadge">{badge}</span>}
      </button>

      {isOpen && <div className="collapsibleBody">{children}</div>}
    </section>
  );
}

function getPlatformIcon(platform: ChatMessage["platform"]) {
  if (platform === "twitch") return "T";
  if (platform === "youtube") return "Y";
  return "M";
}

function getPlatformClassName(platform: ChatMessage["platform"]) {
  if (platform === "twitch") return "platform twitchPlatform";
  if (platform === "youtube") return "platform youtubePlatform";
  return "platform mockPlatform";
}

function getSourcePlatformLabel(platform: ChatSource["platform"]) {
  if (platform === "twitch") return "Twitch";
  return "YouTube";
}

function clampNumber(value: number, fallback: number, min: number, max: number) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function normalizeTwitchChannelName(channelName: string) {
  return channelName.trim().replace(/^#/, "").replace(/^@/, "").toLowerCase();
}

function normalizeYouTubeInput(channelName: string) {
  return channelName.trim();
}

function normalizeSourceInput(platform: ChatSource["platform"], input: string) {
  if (platform === "twitch") {
    return normalizeTwitchChannelName(input);
  }

  return normalizeYouTubeInput(input);
}

function createSourceId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const defaultTwitchStatus: TwitchConnectionStatus = {
  connected: false,
  channelNames: [],
  error: null,
  authenticated: false,
  username: null,
};

const defaultYouTubeStatus: YouTubeConnectionStatus = {
  connected: false,
  sources: [],
  error: null,
};

const defaultTwitchAuthStatus: SafeTwitchAuthState = {
  enabled: false,
  username: null,
  scopes: [],
  expiresAt: null,
  hasToken: false,
};

export function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [settingsFilePath] = useState("");

  const [sources, setSources] = useState<ChatSource[]>([]);
  const [youtubeApiKey, setYoutubeApiKey] = useState("");

  const [activeAddSourceTab, setActiveAddSourceTab] =
    useState<AddSourceTab>("anonymousTwitch");

  const [anonymousTwitchChannelName, setAnonymousTwitchChannelName] =
    useState("");
  const [authTwitchChannelName, setAuthTwitchChannelName] = useState("");
  const [youtubeInput, setYoutubeInput] = useState("");

  const [twitchAuthStatus, setTwitchAuthStatus] =
    useState<SafeTwitchAuthState>(defaultTwitchAuthStatus);

  const [twitchStatus, setTwitchStatus] =
    useState<TwitchConnectionStatus>(defaultTwitchStatus);
  const [youtubeStatus, setYoutubeStatus] =
    useState<YouTubeConnectionStatus>(defaultYouTubeStatus);

  const [mockOverlayEnabled, setMockOverlayEnabled] = useState(false);
  const [chatActionStatus, setChatActionStatus] = useState("");

  const [overlayWidth, setOverlayWidth] = useState(800);
  const [overlayHeight, setOverlayHeight] = useState(600);
  const [overlayFontSize, setOverlayFontSize] = useState(24);
  const [overlayChatWidth, setOverlayChatWidth] = useState(520);
  const [overlayMaxMessages, setOverlayMaxMessages] = useState(12);
  const [overlayPosition, setOverlayPosition] =
    useState<OverlayPosition>("left");

  const [overlayShowPlatformIcon, setOverlayShowPlatformIcon] = useState(true);
  const [overlayShowChannelName, setOverlayShowChannelName] = useState(true);
  const [overlayShowAuthorName, setOverlayShowAuthorName] = useState(true);

  const [overlayBackgroundOpacity, setOverlayBackgroundOpacity] = useState(65);
  const [overlayBorderRadius, setOverlayBorderRadius] = useState(12);
  const [overlayMessageGap, setOverlayMessageGap] = useState(8);

  const [filterHideCommands, setFilterHideCommands] = useState(false);
  const [filterHideLinks, setFilterHideLinks] = useState(false);
  const [filterOnlyWords, setFilterOnlyWords] = useState("");
  const [filterHighlightWords, setFilterHighlightWords] = useState("");

  const [copyStatus, setCopyStatus] = useState("");
  const [saveStatus, setSaveStatus] = useState("Загружаю настройки...");

  const overlayUrl = "http://localhost:3877/o";

  const enabledSourcesCount = sources.filter((source) => source.enabled).length;
  const twitchSourcesCount = sources.filter(
    (source) => source.enabled && source.platform === "twitch"
  ).length;
  const youtubeSourcesCount = sources.filter(
    (source) => source.enabled && source.platform === "youtube"
  ).length;

  const connectedYoutubeSourcesCount = youtubeStatus.sources.filter(
    (source) => source.connected
  ).length;

  const overlaySettings = useMemo<OverlaySettings>(() => {
    return {
      width: clampNumber(overlayWidth, 800, 100, 5000),
      height: clampNumber(overlayHeight, 600, 100, 5000),
      fontSize: clampNumber(overlayFontSize, 24, 10, 120),
      chatWidth: clampNumber(overlayChatWidth, 520, 200, 3000),
      maxMessages: clampNumber(overlayMaxMessages, 12, 1, 100),
      position: overlayPosition,

      showPlatformIcon: overlayShowPlatformIcon,
      showChannelName: overlayShowChannelName,
      showAuthorName: overlayShowAuthorName,

      backgroundOpacity: clampNumber(overlayBackgroundOpacity, 65, 0, 100),
      borderRadius: clampNumber(overlayBorderRadius, 12, 0, 60),
      messageGap: clampNumber(overlayMessageGap, 8, 0, 40),

      filters: {
        hideCommands: filterHideCommands,
        hideLinks: filterHideLinks,
        onlyWords: filterOnlyWords,
        highlightWords: filterHighlightWords,
      },
    };
  }, [
    overlayWidth,
    overlayHeight,
    overlayFontSize,
    overlayChatWidth,
    overlayMaxMessages,
    overlayPosition,
    overlayShowPlatformIcon,
    overlayShowChannelName,
    overlayShowAuthorName,
    overlayBackgroundOpacity,
    overlayBorderRadius,
    overlayMessageGap,
    filterHideCommands,
    filterHideLinks,
    filterOnlyWords,
    filterHighlightWords,
  ]);

  const appSettings = useMemo<AppSettings>(() => {
    return {
      sources,
      youtubeApiKey,
      overlay: overlaySettings,
    };
  }, [sources, youtubeApiKey, overlaySettings]);

  async function loadTwitchAuthStatus() {
    try {
      const response = await fetch("http://localhost:3877/twitch/auth/status");
      const data = (await response.json()) as SafeTwitchAuthState;
      setTwitchAuthStatus(data);
      return data;
    } catch {
      return defaultTwitchAuthStatus;
    }
  }

  function startTwitchLogin() {
    setChatActionStatus("Открываю Twitch Login...");

    window.open(
      "http://localhost:3877/twitch/auth/start",
      "twitch-auth",
      "width=720,height=820"
    );

    let attempts = 0;

    const timer = window.setInterval(async () => {
      attempts += 1;

      const auth = await loadTwitchAuthStatus();

      if (auth.enabled && auth.hasToken && auth.username) {
        window.clearInterval(timer);
        setChatActionStatus(`Twitch Login выполнен: ${auth.username}`);
      }

      if (attempts > 120) {
        window.clearInterval(timer);
      }
    }, 1000);
  }

  async function logoutTwitch() {
    try {
      const response = await fetch("http://localhost:3877/twitch/auth/logout", {
        method: "POST",
      });

      const data = (await response.json()) as {
        ok: boolean;
        auth: SafeTwitchAuthState;
        twitchStatus: TwitchConnectionStatus;
      };

      setTwitchAuthStatus(data.auth);
      setTwitchStatus(data.twitchStatus);
      setChatActionStatus("Twitch Login отключён");
    } catch {
      setChatActionStatus("Не удалось выйти из Twitch");
    }
  }

  function applyOverlayPreset(preset: OverlayPreset) {
    if (preset === "compact") {
      setOverlayWidth(420);
      setOverlayHeight(320);
      setOverlayFontSize(18);
      setOverlayChatWidth(360);
      setOverlayMaxMessages(6);
      setOverlayPosition("left");
      setOverlayShowPlatformIcon(true);
      setOverlayShowAuthorName(true);
      setOverlayShowChannelName(false);
      setOverlayBackgroundOpacity(55);
      setOverlayBorderRadius(10);
      setOverlayMessageGap(6);
      setChatActionStatus("Пресет overlay: Компактный");
      return;
    }

    if (preset === "standard") {
      setOverlayWidth(800);
      setOverlayHeight(600);
      setOverlayFontSize(24);
      setOverlayChatWidth(520);
      setOverlayMaxMessages(12);
      setOverlayPosition("left");
      setOverlayShowPlatformIcon(true);
      setOverlayShowAuthorName(true);
      setOverlayShowChannelName(true);
      setOverlayBackgroundOpacity(65);
      setOverlayBorderRadius(12);
      setOverlayMessageGap(8);
      setChatActionStatus("Пресет overlay: Стандартный");
      return;
    }

    if (preset === "large") {
      setOverlayWidth(1200);
      setOverlayHeight(700);
      setOverlayFontSize(32);
      setOverlayChatWidth(760);
      setOverlayMaxMessages(10);
      setOverlayPosition("left");
      setOverlayShowPlatformIcon(true);
      setOverlayShowAuthorName(true);
      setOverlayShowChannelName(true);
      setOverlayBackgroundOpacity(70);
      setOverlayBorderRadius(16);
      setOverlayMessageGap(10);
      setChatActionStatus("Пресет overlay: Большой");
      return;
    }

    setOverlayWidth(700);
    setOverlayHeight(450);
    setOverlayFontSize(28);
    setOverlayChatWidth(620);
    setOverlayMaxMessages(8);
    setOverlayPosition("left");
    setOverlayShowPlatformIcon(false);
    setOverlayShowAuthorName(true);
    setOverlayShowChannelName(false);
    setOverlayBackgroundOpacity(0);
    setOverlayBorderRadius(0);
    setOverlayMessageGap(6);
    setChatActionStatus("Пресет overlay: Только текст");
  }

  function addSource(platform: ChatSource["platform"], rawChannelName: string) {
    const channelName = normalizeSourceInput(platform, rawChannelName);

    if (!channelName) {
      setChatActionStatus("Введите канал");
      return false;
    }

    const alreadyExists = sources.some(
      (source) =>
        source.platform === platform && source.channelName === channelName
    );

    if (alreadyExists) {
      setChatActionStatus("Такой источник уже добавлен");
      return false;
    }

    const nextSource: ChatSource = {
      id: createSourceId(),
      platform,
      channelName,
      enabled: true,
    };

    setSources((currentSources) => [...currentSources, nextSource]);
    setChatActionStatus(
      `Источник добавлен: ${getSourcePlatformLabel(nextSource.platform)} / ${
        nextSource.channelName
      }`
    );

    return true;
  }

  function addAnonymousTwitchSource() {
    const added = addSource("twitch", anonymousTwitchChannelName);

    if (added) {
      setAnonymousTwitchChannelName("");
    }
  }

  function addAuthTwitchSource() {
    const added = addSource("twitch", authTwitchChannelName);

    if (added) {
      setAuthTwitchChannelName("");
    }
  }

  function addYouTubeSource() {
    setChatActionStatus("YouTube пока пропускаем, вкладка подготовлена на потом");

    const normalized = normalizeYouTubeInput(youtubeInput);

    if (!normalized) {
      return;
    }
  }

  function removeSource(sourceId: string) {
    setSources((currentSources) =>
      currentSources.filter((source) => source.id !== sourceId)
    );
  }

  function toggleSource(sourceId: string) {
    setSources((currentSources) =>
      currentSources.map((source) =>
        source.id === sourceId
          ? {
              ...source,
              enabled: !source.enabled,
            }
          : source
      )
    );
  }

  async function copyOverlayUrl() {
    try {
      await navigator.clipboard.writeText(overlayUrl);
      setCopyStatus("Ссылка скопирована");

      setTimeout(() => {
        setCopyStatus("");
      }, 2000);
    } catch {
      setCopyStatus("Не удалось скопировать");
    }
  }

  async function setMockOverlayTestEnabled(enabled: boolean) {
    setMockOverlayEnabled(enabled);

    try {
      const response = await fetch(
        enabled
          ? "http://localhost:3877/mock/start"
          : "http://localhost:3877/mock/stop",
        {
          method: "POST",
        }
      );

      const data = (await response.json()) as {
        ok: boolean;
        running: boolean;
      };

      setMockOverlayEnabled(data.running);
      setChatActionStatus(
        data.running
          ? "Тест overlay включён, тестовые сообщения летят в чат"
          : "Тест overlay выключен"
      );
    } catch {
      setMockOverlayEnabled(!enabled);
      setChatActionStatus("Не удалось переключить тест overlay");
    }
  }

  async function connectChat() {
    try {
      setChatActionStatus("Подключаю источники чата...");

      const response = await fetch("http://localhost:3877/chat/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sources,
          youtubeApiKey,
        }),
      });

      const data = (await response.json()) as {
        ok: boolean;
        twitchStatus: TwitchConnectionStatus;
        youtubeStatus: YouTubeConnectionStatus;
        mockStatus?: {
          running: boolean;
        };
      };

      setTwitchStatus(data.twitchStatus);
      setYoutubeStatus(data.youtubeStatus);

      if (data.mockStatus) {
        setMockOverlayEnabled(data.mockStatus.running);
      }

      const parts: string[] = [];

      if (data.twitchStatus.connected) {
        parts.push(`Twitch: ${data.twitchStatus.channelNames.length}`);
      }

      if (data.twitchStatus.authenticated && data.twitchStatus.username) {
        parts.push(`Login: ${data.twitchStatus.username}`);
      }

      if (data.youtubeStatus.connected) {
        const connectedCount = data.youtubeStatus.sources.filter(
          (source) => source.connected
        ).length;

        parts.push(`YouTube: ${connectedCount}`);
      }

      if (data.mockStatus?.running) {
        parts.push("Тест overlay");
      }

      if (parts.length === 0) {
        setChatActionStatus(
          data.twitchStatus.error ||
            data.youtubeStatus.error ||
            "Нет активных источников для подключения"
        );
        return;
      }

      setChatActionStatus(`Активные источники: ${parts.join(", ")}`);
    } catch {
      setChatActionStatus("Ошибка подключения источников");
    }
  }

  async function disconnectChat() {
    try {
      setChatActionStatus("Отключаю Twitch и YouTube...");

      const response = await fetch("http://localhost:3877/chat/disconnect", {
        method: "POST",
      });

      const data = (await response.json()) as {
        ok: boolean;
        twitchStatus: TwitchConnectionStatus;
        youtubeStatus: YouTubeConnectionStatus;
        mockStatus?: {
          running: boolean;
        };
      };

      setTwitchStatus(data.twitchStatus);
      setYoutubeStatus(data.youtubeStatus);

      if (data.mockStatus) {
        setMockOverlayEnabled(data.mockStatus.running);
      }

      setChatActionStatus(
        data.mockStatus?.running
          ? "Twitch и YouTube отключены, тест overlay продолжает работать"
          : "Источники отключены"
      );
    } catch {
      setChatActionStatus("Не удалось отключить источники");
    }
  }

  async function clearMessages() {
    try {
      await fetch("http://localhost:3877/messages/clear", {
        method: "POST",
      });

      setMessages([]);
    } catch {
      // Ничего страшного, просто не очистилось.
    }
  }

  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch("http://localhost:3877/settings");
        const data = (await response.json()) as AppSettings;

        setSources(data.sources || []);
        setYoutubeApiKey(data.youtubeApiKey || "");

        setOverlayWidth(data.overlay.width);
        setOverlayHeight(data.overlay.height);
        setOverlayFontSize(data.overlay.fontSize);
        setOverlayChatWidth(data.overlay.chatWidth);
        setOverlayMaxMessages(data.overlay.maxMessages);
        setOverlayPosition(data.overlay.position);

        setOverlayShowPlatformIcon(data.overlay.showPlatformIcon);
        setOverlayShowChannelName(data.overlay.showChannelName);
        setOverlayShowAuthorName(data.overlay.showAuthorName);

        setOverlayBackgroundOpacity(data.overlay.backgroundOpacity);
        setOverlayBorderRadius(data.overlay.borderRadius);
        setOverlayMessageGap(data.overlay.messageGap);

        setFilterHideCommands(data.overlay.filters.hideCommands);
        setFilterHideLinks(data.overlay.filters.hideLinks);
        setFilterOnlyWords(data.overlay.filters.onlyWords);
        setFilterHighlightWords(data.overlay.filters.highlightWords);

        setSettingsLoaded(true);
        setSaveStatus("Настройки загружены");
      } catch {
        setSettingsLoaded(true);
        setSaveStatus("Не удалось загрузить настройки");
      }
    }

    loadSettings();
    loadTwitchAuthStatus();
  }, []);

  useEffect(() => {
    async function loadMockStatus() {
      try {
        const response = await fetch("http://localhost:3877/mock/status");
        const data = (await response.json()) as {
          running: boolean;
        };

        setMockOverlayEnabled(data.running);
      } catch {
        // Сервер мог ещё просыпаться.
      }
    }

    loadMockStatus();
  }, []);

  useEffect(() => {
    if (!settingsLoaded) {
      return;
    }

    const controller = new AbortController();

    async function saveSettings() {
      try {
        setSaveStatus("Сохраняю настройки...");

        const response = await fetch("http://localhost:3877/settings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(appSettings),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Settings request failed");
        }

        setSaveStatus("Настройки сохранены");
      } catch {
        if (!controller.signal.aborted) {
          setSaveStatus("Не удалось сохранить настройки");
        }
      }
    }

    const timer = window.setTimeout(saveSettings, 350);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [settingsLoaded, appSettings]);

  useEffect(() => {
    async function loadStatuses() {
      try {
        const twitchResponse = await fetch("http://localhost:3877/twitch/status");
        const twitchData = (await twitchResponse.json()) as TwitchConnectionStatus;
        setTwitchStatus(twitchData);
      } catch {
        // Сервер мог ещё просыпаться.
      }

      try {
        const youtubeResponse = await fetch("http://localhost:3877/youtube/status");
        const youtubeData =
          (await youtubeResponse.json()) as YouTubeConnectionStatus;
        setYoutubeStatus(youtubeData);
      } catch {
        // Сервер мог ещё просыпаться.
      }
    }

    loadStatuses();
  }, []);

  useEffect(() => {
    let socket: WebSocket | null = null;
    let reconnectTimer: number | null = null;
    let stopped = false;

    async function loadExistingMessages() {
      try {
        const response = await fetch("http://localhost:3877/messages");
        const data = (await response.json()) as ChatMessage[];

        setMessages(data.slice(-100));
      } catch {
        // Сервер мог ещё просыпаться.
      }
    }

    function connectSocket() {
      socket = new WebSocket("ws://localhost:3877/app/ws");

      socket.addEventListener("open", () => {
        loadExistingMessages();
      });

      socket.addEventListener("message", (event) => {
        const message = JSON.parse(event.data) as ChatMessage;

        setMessages((currentMessages) => {
          const nextMessages = [...currentMessages, message];
          return nextMessages.slice(-100);
        });
      });

      socket.addEventListener("close", () => {
        if (stopped) {
          return;
        }

        reconnectTimer = window.setTimeout(connectSocket, 1000);
      });
    }

    loadExistingMessages();
    connectSocket();

    return () => {
      stopped = true;

      if (reconnectTimer !== null) {
        window.clearTimeout(reconnectTimer);
      }

      if (socket) {
        socket.close();
      }
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages]);

  return (
    <main className="app">
      <aside className="sidebar">
        <h1>Stream Chat Hub</h1>

        <CollapsibleSection
          title="Источники чата"
          badge={`${enabledSourcesCount} активн.`}
        >
          <div className="connectionStatus">
            <p>Активных источников: {enabledSourcesCount}</p>
            <p>🟣 Twitch: {twitchSourcesCount}</p>
            <p>🔴 YouTube: {youtubeSourcesCount}</p>

            <p>
              Twitch-соединение:{" "}
              {twitchStatus.connected
                ? `подключено к ${twitchStatus.channelNames.length} каналам`
                : "не подключено"}
            </p>

            <p>
              Twitch Login:{" "}
              {twitchAuthStatus.enabled && twitchAuthStatus.username
                ? `выполнен как ${twitchAuthStatus.username}`
                : "не выполнен"}
            </p>

            {twitchStatus.error && (
              <p className="errorText">{twitchStatus.error}</p>
            )}

            <p>
              YouTube-соединение:{" "}
              {youtubeStatus.connected
                ? `подключено источников: ${connectedYoutubeSourcesCount}`
                : "не подключено"}
            </p>

            {youtubeStatus.error && (
              <p className="errorText">{youtubeStatus.error}</p>
            )}
          </div>

          <div className="sourceList">
            {sources.length === 0 && (
              <p className="emptyText">Источники ещё не добавлены</p>
            )}

            {sources.map((source) => (
              <div className="sourceRow" key={source.id}>
                <button
                  className={source.enabled ? "sourceToggle enabled" : "sourceToggle"}
                  type="button"
                  onClick={() => toggleSource(source.id)}
                  title={source.enabled ? "Источник включён" : "Источник выключен"}
                >
                  {source.enabled ? "✓" : "○"}
                </button>

                <span className="sourceIcon">
                  {source.platform === "twitch" ? "🟣" : "🔴"}
                </span>

                <div className="sourceInfo">
                  <strong>{getSourcePlatformLabel(source.platform)}</strong>
                  <span>
                    {source.platform === "twitch"
                      ? `#${source.channelName}`
                      : source.channelName}
                  </span>
                </div>

                <button
                  className="removeSourceButton"
                  type="button"
                  onClick={() => removeSource(source.id)}
                  title="Удалить источник"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className="addSourceTabs">
            <button
              className={
                activeAddSourceTab === "anonymousTwitch"
                  ? "tabButton active"
                  : "tabButton"
              }
              type="button"
              onClick={() => setActiveAddSourceTab("anonymousTwitch")}
            >
              Без входа
            </button>

            <button
              className={
                activeAddSourceTab === "twitchLogin"
                  ? "tabButton active"
                  : "tabButton"
              }
              type="button"
              onClick={() => setActiveAddSourceTab("twitchLogin")}
            >
              Twitch Login
            </button>

            <button
              className={
                activeAddSourceTab === "youtube" ? "tabButton active" : "tabButton"
              }
              type="button"
              onClick={() => setActiveAddSourceTab("youtube")}
            >
              YouTube позже
            </button>
          </div>

          {activeAddSourceTab === "anonymousTwitch" && (
            <div className="addSourceBox tabPanel">
              <MiniCollapsibleSection title="Публичное чтение Twitch-чата">
                <div className="tabIntro">
                  <strong>Публичное чтение Twitch-чата</strong>
                  <small>
                    Вход не нужен. Подходит для простого чтения открытых
                    Twitch-каналов.
                  </small>
                </div>

                <label className="field">
                  <span>Twitch-канал</span>
                  <input
                    type="text"
                    placeholder="Например: shroud"
                    value={anonymousTwitchChannelName}
                    onChange={(event) =>
                      setAnonymousTwitchChannelName(event.target.value)
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        addAnonymousTwitchSource();
                      }
                    }}
                  />
                </label>

                <button
                  className="button"
                  type="button"
                  onClick={addAnonymousTwitchSource}
                >
                  Добавить Twitch-канал
                </button>
              </MiniCollapsibleSection>
            </div>
          )}

          {activeAddSourceTab === "twitchLogin" && (
            <div className="addSourceBox tabPanel">
              <MiniCollapsibleSection title="Работа через Twitch-аккаунт">
                <div className="tabIntro">
                  <strong>Работа через Twitch-аккаунт</strong>
                  <small>
                    Пользователь входит через Twitch. Потом подключение к чату
                    идёт с его user access token.
                  </small>
                </div>

                <div className="authCard">
                  <div>
                    <span className="authLabel">Статус</span>
                    <strong>
                      {twitchAuthStatus.enabled && twitchAuthStatus.username
                        ? `Выполнен вход: ${twitchAuthStatus.username}`
                        : "Не выполнен вход"}
                    </strong>
                  </div>

                  {twitchAuthStatus.enabled && twitchAuthStatus.hasToken ? (
                    <button
                      className="button secondaryButton"
                      type="button"
                      onClick={logoutTwitch}
                    >
                      Выйти из Twitch
                    </button>
                  ) : (
                    <button
                      className="button"
                      type="button"
                      onClick={startTwitchLogin}
                    >
                      Войти через Twitch
                    </button>
                  )}
                </div>
              </MiniCollapsibleSection>

              <MiniCollapsibleSection title="Twitch-канал для чтения">
                <label className="field">
                  <span>Twitch-канал для чтения</span>
                  <input
                    type="text"
                    placeholder="Например: shroud"
                    value={authTwitchChannelName}
                    onChange={(event) =>
                      setAuthTwitchChannelName(event.target.value)
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        addAuthTwitchSource();
                      }
                    }}
                  />
                </label>

                <button
                  className="button"
                  type="button"
                  onClick={addAuthTwitchSource}
                >
                  Добавить канал через Twitch Login
                </button>

                <p className="hint">
                  После входа нажми “Подключить источники”, чтобы переподключить
                  Twitch уже с авторизацией.
                </p>
              </MiniCollapsibleSection>
            </div>
          )}

          {activeAddSourceTab === "youtube" && (
            <div className="addSourceBox tabPanel">
              <MiniCollapsibleSection title="YouTube будет позже">
                <div className="tabIntro">
                  <strong>YouTube будет позже</strong>
                  <small>
                    Вкладка уже есть, чтобы интерфейс был готов к двум платформам.
                  </small>
                </div>

                <label className="field">
                  <span>YouTube-ссылка или video id</span>
                  <input
                    type="text"
                    placeholder="Пока пропускаем YouTube"
                    value={youtubeInput}
                    onChange={(event) => setYoutubeInput(event.target.value)}
                    disabled
                  />
                </label>

                <label className="field youtubeApiKeyField">
                  <span>YouTube API key</span>
                  <input
                    type="password"
                    placeholder="Пока не используем"
                    value={youtubeApiKey}
                    onChange={(event) => setYoutubeApiKey(event.target.value)}
                    disabled
                  />
                </label>

                <button
                  className="button secondaryButton"
                  type="button"
                  onClick={addYouTubeSource}
                >
                  YouTube пока отключён
                </button>
              </MiniCollapsibleSection>
            </div>
          )}

          <div className="buttonRow">
            <button className="button" type="button" onClick={connectChat}>
              Подключить источники
            </button>

            <button
              className="button secondaryButton"
              type="button"
              onClick={disconnectChat}
            >
              Отключить Twitch/YouTube
            </button>
          </div>

          {chatActionStatus && <p className="copyStatus">{chatActionStatus}</p>}
        </CollapsibleSection>

        <CollapsibleSection
          title="OBS Overlay"
          badge={`${overlayWidth}×${overlayHeight}`}
        >
          <p className="hint">
            Быстрые пресеты. После выбора можно вручную докрутить любые поля.
          </p>

          <div className="buttonRow">
            <button
              className="button ghostButton"
              type="button"
              onClick={() => applyOverlayPreset("compact")}
            >
              Компактный
            </button>

            <button
              className="button ghostButton"
              type="button"
              onClick={() => applyOverlayPreset("standard")}
            >
              Стандартный
            </button>
          </div>

          <div className="buttonRow">
            <button
              className="button ghostButton"
              type="button"
              onClick={() => applyOverlayPreset("large")}
            >
              Большой
            </button>

            <button
              className="button ghostButton"
              type="button"
              onClick={() => applyOverlayPreset("textOnly")}
            >
              Только текст
            </button>
          </div>

          <div className="fieldGroup">
            <label className="field">
              <span>Ширина OBS</span>
              <input
                type="number"
                min="100"
                value={overlayWidth}
                onChange={(event) => setOverlayWidth(Number(event.target.value))}
              />
            </label>

            <label className="field">
              <span>Высота OBS</span>
              <input
                type="number"
                min="100"
                value={overlayHeight}
                onChange={(event) => setOverlayHeight(Number(event.target.value))}
              />
            </label>

            <label className="field">
              <span>Размер шрифта</span>
              <input
                type="number"
                min="10"
                max="120"
                value={overlayFontSize}
                onChange={(event) => setOverlayFontSize(Number(event.target.value))}
              />
            </label>

            <label className="field">
              <span>Ширина блока чата</span>
              <input
                type="number"
                min="200"
                max="3000"
                value={overlayChatWidth}
                onChange={(event) =>
                  setOverlayChatWidth(Number(event.target.value))
                }
              />
            </label>

            <label className="field">
              <span>Сообщений на экране</span>
              <input
                type="number"
                min="1"
                max="100"
                value={overlayMaxMessages}
                onChange={(event) =>
                  setOverlayMaxMessages(Number(event.target.value))
                }
              />
            </label>

            <label className="field">
              <span>Позиция</span>
              <select
                value={overlayPosition}
                onChange={(event) =>
                  setOverlayPosition(event.target.value as OverlayPosition)
                }
              >
                <option value="left">Слева снизу</option>
                <option value="center">По центру снизу</option>
                <option value="right">Справа снизу</option>
              </select>
            </label>
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="Внешний вид сообщений">
          <div className="toggleGroup">
            <label className="toggleField">
              <input
                type="checkbox"
                checked={overlayShowPlatformIcon}
                onChange={(event) =>
                  setOverlayShowPlatformIcon(event.target.checked)
                }
              />
              <span>Показывать иконку платформы</span>
            </label>

            <label className="toggleField">
              <input
                type="checkbox"
                checked={overlayShowAuthorName}
                onChange={(event) => setOverlayShowAuthorName(event.target.checked)}
              />
              <span>Показывать имя автора</span>
            </label>

            <label className="toggleField">
              <input
                type="checkbox"
                checked={overlayShowChannelName}
                onChange={(event) =>
                  setOverlayShowChannelName(event.target.checked)
                }
              />
              <span>Показывать канал</span>
            </label>
          </div>

          <div className="fieldGroup">
            <label className="field">
              <span>Прозрачность фона: {overlayBackgroundOpacity}%</span>
              <input
                type="range"
                min="0"
                max="100"
                value={overlayBackgroundOpacity}
                onChange={(event) =>
                  setOverlayBackgroundOpacity(Number(event.target.value))
                }
              />
            </label>

            <label className="field">
              <span>Скругление: {overlayBorderRadius}px</span>
              <input
                type="range"
                min="0"
                max="60"
                value={overlayBorderRadius}
                onChange={(event) =>
                  setOverlayBorderRadius(Number(event.target.value))
                }
              />
            </label>

            <label className="field">
              <span>Расстояние: {overlayMessageGap}px</span>
              <input
                type="range"
                min="0"
                max="40"
                value={overlayMessageGap}
                onChange={(event) => setOverlayMessageGap(Number(event.target.value))}
              />
            </label>
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="Фильтры сообщений">
          <div className="toggleGroup">
            <label className="toggleField">
              <input
                type="checkbox"
                checked={filterHideCommands}
                onChange={(event) => setFilterHideCommands(event.target.checked)}
              />
              <span>Скрывать команды, которые начинаются с !</span>
            </label>

            <label className="toggleField">
              <input
                type="checkbox"
                checked={filterHideLinks}
                onChange={(event) => setFilterHideLinks(event.target.checked)}
              />
              <span>Скрывать сообщения со ссылками</span>
            </label>
          </div>

          <label className="field filterField">
            <span>Показывать только сообщения со словами</span>
            <input
              type="text"
              placeholder="Например: розыгрыш, вопрос, help"
              value={filterOnlyWords}
              onChange={(event) => setFilterOnlyWords(event.target.value)}
            />
          </label>

          <label className="field filterField">
            <span>Подсвечивать слова</span>
            <input
              type="text"
              placeholder="Например: важно, донат, вопрос"
              value={filterHighlightWords}
              onChange={(event) => setFilterHighlightWords(event.target.value)}
            />
          </label>

          <p className="hint">
            Слова разделяй запятыми. Фильтры применяются только к OBS overlay,
            общий чат в приложении остаётся полным.
          </p>
        </CollapsibleSection>

        <CollapsibleSection title="Ссылка для OBS">
          <code>{overlayUrl}</code>

          <button className="button" type="button" onClick={copyOverlayUrl}>
            Скопировать ссылку
          </button>

          {copyStatus && <p className="copyStatus">{copyStatus}</p>}

          <p className="copyStatus">{saveStatus}</p>

          {settingsFilePath && (
            <p className="hint">
              Файл настроек: <br />
              {settingsFilePath}
            </p>
          )}

          <p className="hint">
            В OBS вставь короткую ссылку выше. Width и Height в OBS укажи такими
            же, как в полях приложения.
          </p>
        </CollapsibleSection>

        <CollapsibleSection
          title="Тест overlay"
          badge={mockOverlayEnabled ? "включён" : "выключен"}
        >
          <label className="bigToggleField">
            <input
              type="checkbox"
              checked={mockOverlayEnabled}
              onChange={(event) => setMockOverlayTestEnabled(event.target.checked)}
            />
            <span>
              <strong>Включить тест overlay</strong>
              <small>
                Добавляет тестовые сообщения в общий поток. Можно проверять OBS,
                фильтры, размеры и внешний вид даже без реального чата.
              </small>
            </span>
          </label>

          <p className="hint">
            Эта галочка не отключает Twitch. Тестовые сообщения просто идут рядом
            с настоящими.
          </p>
        </CollapsibleSection>

        <CollapsibleSection title="О проекте и контакты" badge="v1.2.0">
          <div className="aboutBox">
            <p>
              <strong>Stream Chat Hub</strong> beta v1.2.0
            </p>

            <p className="hint">
              Приложение для объединения чатов стрима и вывода overlay в OBS.
            </p>

            <div className="linkList">
              <a
                href="https://github.com/postdelik/Stream-Chat-Hub"
                target="_blank"
                rel="noreferrer"
              >
                GitHub проекта
              </a>

              <a
                href="https://boosty.to/postdelik"
                target="_blank"
                rel="noreferrer"
              >
                Поддержать проект
              </a>
            </div>
          </div>
        </CollapsibleSection>
      </aside>

      <section className="chat">
        <header className="chatHeader">
          <div>
            <h2>Общий чат</h2>
            <span>{messages.length} сообщений</span>
          </div>

          <button className="smallButton" type="button" onClick={clearMessages}>
            Очистить
          </button>
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
    </main>
  );
}