import { useEffect, useMemo, useRef, useState } from "react";
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
import { languageStorageKey, overlayUrl } from "./constants";
import { translations, type AppLanguage } from "./i18n/translations";
import {
  createSourceId,
  getSourcePlatformLabel,
  normalizeSourceInput,
  normalizeYouTubeInput,
} from "./utils/chat";
import { clampNumber } from "./utils/numbers";
import { AboutSection } from "./components/AboutSection";
import { ChatView } from "./components/ChatView";
import { OverlaySettingsSection } from "./components/OverlaySettingsSection";
import { OverlayAppearanceSection } from "./components/OverlayAppearanceSection";
import { MessageFiltersSection } from "./components/MessageFiltersSection";
import { ObsLinkSection } from "./components/ObsLinkSection";
import { SourcesSection, type AddSourceTab } from "./components/SourcesSection";
import { TestOverlaySection } from "./components/TestOverlaySection";

type OverlayPreset = "compact" | "standard" | "large" | "textOnly";

function getSavedLanguage(): AppLanguage | null {
  const value = localStorage.getItem(languageStorageKey);

  if (value === "ru" || value === "en") {
    return value;
  }

  return null;
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
  const [language, setLanguage] = useState<AppLanguage | null>(() =>
    getSavedLanguage()
  );

  const t = (key: string) => {
    const activeLanguage = language || "ru";
    return translations[activeLanguage][key] || key;
  };

  function chooseLanguage(nextLanguage: AppLanguage) {
    localStorage.setItem(languageStorageKey, nextLanguage);
    setLanguage(nextLanguage);
  }

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
  const [saveStatus, setSaveStatus] = useState(t("loadingSettings"));

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
    setChatActionStatus(t("openTwitchLogin"));

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
        setChatActionStatus(`${t("twitchLoginDone")}: ${auth.username}`);
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
      setChatActionStatus(t("twitchLogoutDone"));
    } catch {
      setChatActionStatus(t("twitchLogoutFailed"));
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
      setChatActionStatus(t("presetCompact"));
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
      setChatActionStatus(t("presetStandard"));
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
      setChatActionStatus(t("presetLarge"));
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
    setChatActionStatus(t("presetTextOnly"));
  }

  function addSource(platform: ChatSource["platform"], rawChannelName: string) {
    const channelName = normalizeSourceInput(platform, rawChannelName);

    if (!channelName) {
      setChatActionStatus(t("enterChannel"));
      return false;
    }

    const alreadyExists = sources.some(
      (source) =>
        source.platform === platform && source.channelName === channelName
    );

    if (alreadyExists) {
      setChatActionStatus(t("sourceAlreadyAdded"));
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
      `${t("sourceAdded")}: ${getSourcePlatformLabel(nextSource.platform)} / ${
        nextSource.channelName
      }`
    );

    return true;
  }

  function addAnonymousTwitchSource() {
    const channelName = normalizeSourceInput("twitch", anonymousTwitchChannelName);

    if (!channelName) {
      setChatActionStatus(t("enterChannel"));
      return;
    }

    const alreadyExists = sources.some(
      (source) =>
        source.platform === "twitch" && source.channelName === channelName
    );

    if (alreadyExists) {
      setChatActionStatus(t("sourceAlreadyAdded"));
      return;
    }

    const nextSource: ChatSource = {
      id: createSourceId(),
      platform: "twitch",
      channelName,
      enabled: true,
    };

    const nextSources = [...sources, nextSource];

    setSources(nextSources);
    setAnonymousTwitchChannelName("");
    setChatActionStatus(`Источник добавлен, подключаю Twitch: #${channelName}`);

    void connectChatWithSources(nextSources);
  }

  function addAuthTwitchSource() {
    const added = addSource("twitch", authTwitchChannelName);

    if (added) {
      setAuthTwitchChannelName("");
    }
  }

  function addYouTubeSource() {
    setChatActionStatus(t("youtubeSkipped"));

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
      setCopyStatus(t("copied"));

      setTimeout(() => {
        setCopyStatus("");
      }, 2000);
    } catch {
      setCopyStatus(t("copyFailed"));
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
        data.running ? t("testOverlayEnabled") : t("testOverlayDisabled")
      );
    } catch {
      setMockOverlayEnabled(!enabled);
      setChatActionStatus(t("testOverlaySwitchFailed"));
    }
  }

  async function connectChat() {
    try {
      setChatActionStatus(t("connectingSources"));

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
        parts.push(t("testOverlayPart"));
      }

      if (parts.length === 0) {
        setChatActionStatus(
          data.twitchStatus.error ||
            data.youtubeStatus.error ||
            t("noActiveSources")
        );
        return;
      }

      setChatActionStatus(`${t("activeSourcesStatus")}: ${parts.join(", ")}`);
    } catch {
      setChatActionStatus(t("connectSourcesFailed"));
    }
  }

  async function connectChatWithSources(nextSources: ChatSource[]) {
    try {
      setChatActionStatus(t("connectingSources"));

      const response = await fetch("http://localhost:3877/chat/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sources: nextSources,
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

      if (data.twitchStatus.connected) {
        setChatActionStatus(
          `Twitch подключён: ${data.twitchStatus.channelNames
            .map((name) => `#${name}`)
            .join(", ")}`
        );
        return;
      }

      if (data.mockStatus?.running) {
        setChatActionStatus(t("testOverlayEnabled"));
        return;
      }

      setChatActionStatus(
        data.twitchStatus.error ||
          data.youtubeStatus.error ||
          t("noActiveSources")
      );
    } catch {
      setChatActionStatus(t("connectSourcesFailed"));
    }
  }

  async function disconnectChat() {
    try {
      setChatActionStatus(t("disconnectingSources"));

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
          ? t("sourcesDisconnectedTestKeepsRunning")
          : t("sourcesDisconnected")
      );
    } catch {
      setChatActionStatus(t("disconnectSourcesFailed"));
    }
  }

  async function clearMessages() {
    try {
      await fetch("http://localhost:3877/messages/clear", {
        method: "POST",
      });

      setMessages([]);
    } catch {
      // Nothing dangerous here.
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
        setSaveStatus(t("settingsLoaded"));
      } catch {
        setSettingsLoaded(true);
        setSaveStatus(t("settingsLoadFailed"));
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
        // Server may still be waking up.
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
        setSaveStatus(t("savingSettings"));

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

        setSaveStatus(t("settingsSaved"));
      } catch {
        if (!controller.signal.aborted) {
          setSaveStatus(t("settingsSaveFailed"));
        }
      }
    }

    const timer = window.setTimeout(saveSettings, 350);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [settingsLoaded, appSettings, language]);

  useEffect(() => {
    async function loadStatuses() {
      try {
        const twitchResponse = await fetch("http://localhost:3877/twitch/status");
        const twitchData = (await twitchResponse.json()) as TwitchConnectionStatus;
        setTwitchStatus(twitchData);
      } catch {
        // Server may still be waking up.
      }

      try {
        const youtubeResponse = await fetch("http://localhost:3877/youtube/status");
        const youtubeData =
          (await youtubeResponse.json()) as YouTubeConnectionStatus;
        setYoutubeStatus(youtubeData);
      } catch {
        // Server may still be waking up.
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
        // Server may still be waking up.
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

  if (!language) {
    return (
      <main className="languageScreen">
        <section className="languageCard">
          <div className="languageLogo">💬</div>
          <h1>Stream Chat Hub</h1>
          <h2>{translations.ru.chooseLanguageTitle} / Choose language</h2>
          <p>
            Выберите язык интерфейса. You can change it later in the app
            settings.
          </p>

          <div className="languageButtons">
            <button
              className="button"
              type="button"
              onClick={() => chooseLanguage("ru")}
            >
              Русский
            </button>

            <button
              className="button secondaryButton"
              type="button"
              onClick={() => chooseLanguage("en")}
            >
              English
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="app">
      <aside className="sidebar">
        <h1>{t("appTitle")}</h1>

        <SourcesSection
          t={t}
          enabledSourcesCount={enabledSourcesCount}
          twitchSourcesCount={twitchSourcesCount}
          youtubeSourcesCount={youtubeSourcesCount}
          connectedYoutubeSourcesCount={connectedYoutubeSourcesCount}
          sources={sources}
          twitchStatus={twitchStatus}
          twitchAuthStatus={twitchAuthStatus}
          youtubeStatus={youtubeStatus}
          activeAddSourceTab={activeAddSourceTab}
          setActiveAddSourceTab={setActiveAddSourceTab}
          anonymousTwitchChannelName={anonymousTwitchChannelName}
          setAnonymousTwitchChannelName={setAnonymousTwitchChannelName}
          authTwitchChannelName={authTwitchChannelName}
          setAuthTwitchChannelName={setAuthTwitchChannelName}
          youtubeInput={youtubeInput}
          setYoutubeInput={setYoutubeInput}
          youtubeApiKey={youtubeApiKey}
          setYoutubeApiKey={setYoutubeApiKey}
          chatActionStatus={chatActionStatus}
          toggleSource={toggleSource}
          removeSource={removeSource}
          addAnonymousTwitchSource={addAnonymousTwitchSource}
          addAuthTwitchSource={addAuthTwitchSource}
          addYouTubeSource={addYouTubeSource}
          startTwitchLogin={startTwitchLogin}
          logoutTwitch={logoutTwitch}
          connectChat={connectChat}
          disconnectChat={disconnectChat}
        />

        <OverlaySettingsSection
          t={t}
          overlayWidth={overlayWidth}
          overlayHeight={overlayHeight}
          overlayFontSize={overlayFontSize}
          overlayChatWidth={overlayChatWidth}
          overlayMaxMessages={overlayMaxMessages}
          overlayPosition={overlayPosition}
          setOverlayWidth={setOverlayWidth}
          setOverlayHeight={setOverlayHeight}
          setOverlayFontSize={setOverlayFontSize}
          setOverlayChatWidth={setOverlayChatWidth}
          setOverlayMaxMessages={setOverlayMaxMessages}
          setOverlayPosition={setOverlayPosition}
          applyOverlayPreset={applyOverlayPreset}
        />

        <OverlayAppearanceSection
          t={t}
          overlayShowPlatformIcon={overlayShowPlatformIcon}
          overlayShowAuthorName={overlayShowAuthorName}
          overlayShowChannelName={overlayShowChannelName}
          overlayBackgroundOpacity={overlayBackgroundOpacity}
          overlayBorderRadius={overlayBorderRadius}
          overlayMessageGap={overlayMessageGap}
          setOverlayShowPlatformIcon={setOverlayShowPlatformIcon}
          setOverlayShowAuthorName={setOverlayShowAuthorName}
          setOverlayShowChannelName={setOverlayShowChannelName}
          setOverlayBackgroundOpacity={setOverlayBackgroundOpacity}
          setOverlayBorderRadius={setOverlayBorderRadius}
          setOverlayMessageGap={setOverlayMessageGap}
        />

        <MessageFiltersSection
          t={t}
          filterHideCommands={filterHideCommands}
          filterHideLinks={filterHideLinks}
          filterOnlyWords={filterOnlyWords}
          filterHighlightWords={filterHighlightWords}
          setFilterHideCommands={setFilterHideCommands}
          setFilterHideLinks={setFilterHideLinks}
          setFilterOnlyWords={setFilterOnlyWords}
          setFilterHighlightWords={setFilterHighlightWords}
        />

        <ObsLinkSection
          t={t}
          overlayUrl={overlayUrl}
          copyStatus={copyStatus}
          saveStatus={saveStatus}
          settingsFilePath={settingsFilePath}
          copyOverlayUrl={copyOverlayUrl}
        />

        <TestOverlaySection
          t={t}
          mockOverlayEnabled={mockOverlayEnabled}
          setMockOverlayTestEnabled={setMockOverlayTestEnabled}
        />

        <AboutSection
          language={language}
          t={t}
          chooseLanguage={chooseLanguage}
        />
      </aside>

      <ChatView
        messages={messages}
        messagesEndRef={messagesEndRef}
        t={t}
        clearMessages={clearMessages}
      />
    </main>
  );
}