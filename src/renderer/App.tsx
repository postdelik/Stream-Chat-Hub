import { useEffect, useMemo, useRef, useState } from "react";
import type {
  AppSettings,
  ChatMessage,
  ChatSource,
  OverlayBubbleMediaType,
  OverlayPosition,
  OverlaySettings,
  OverlayStyleMode,
  SafeTwitchAuthState,
  SafeYouTubeAuthState,
  TwitchConnectionStatus,
  TwitchViewersStatus,
  UpdateCheckResult,
  UpdateInstallResult,
  UpdateSettings,
  YouTubeConnectionStatus,
} from "../shared/types";
import { languageStorageKey, overlayUrl } from "./constants";
import { translations, type AppLanguage } from "./i18n/translations";
import {
  createSourceId,
  normalizeSourceInput,
  normalizeYouTubeInput,
} from "./utils/chat";
import { clampNumber } from "./utils/numbers";
import { AboutSection } from "./components/AboutSection";
import { ChatView } from "./components/ChatView";
import { DiagnosticsSection } from "./components/DiagnosticsSection";
import { MessageFiltersSection } from "./components/MessageFiltersSection";
import { ObsLinkSection } from "./components/ObsLinkSection";
import { OverlayAppearanceSection } from "./components/OverlayAppearanceSection";
import { OverlaySettingsSection } from "./components/OverlaySettingsSection";
import { SourcesSection, type AddSourceTab } from "./components/SourcesSection";
import { TestOverlaySection } from "./components/TestOverlaySection";
import { UpdatePromptModal } from "./components/UpdatePromptModal";
import { UpdatesSection } from "./components/UpdatesSection";

type OverlayPreset = "compact" | "standard" | "large" | "textOnly";

function getSavedLanguage(): AppLanguage | null {
  const value = localStorage.getItem(languageStorageKey);
  return value === "ru" || value === "en" ? value : null;
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

const defaultYouTubeAuthStatus: SafeYouTubeAuthState = {
  enabled: false,
  scopes: [],
  expiresAt: null,
  hasAccessToken: false,
  hasRefreshToken: false,
  configured: false,
};

const defaultTwitchViewersStatus: TwitchViewersStatus = {
  totalViewers: 0,
  channels: [],
  error: null,
};

const defaultUpdateSettings: UpdateSettings = {
  autoCheckEnabled: true,
  skippedVersion: "",
};

const fallbackFonts = [
  "Inter, Arial, sans-serif",
  "Arial, sans-serif",
  "Segoe UI, sans-serif",
  "Verdana, sans-serif",
  "Tahoma, sans-serif",
  "Georgia, serif",
  "Times New Roman, serif",
  "Courier New, monospace",
];

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
  const [, setSaveStatus] = useState(t("loadingSettings"));

  const [sources, setSources] = useState<ChatSource[]>([]);
  const [activeAddSourceTab, setActiveAddSourceTab] =
    useState<AddSourceTab>("anonymousTwitch");

  const [anonymousTwitchChannelName, setAnonymousTwitchChannelName] =
    useState("");
  const [authTwitchChannelName, setAuthTwitchChannelName] = useState("");
  const [youtubeInput, setYoutubeInput] = useState("");

  const [twitchAuthStatus, setTwitchAuthStatus] =
    useState<SafeTwitchAuthState>(defaultTwitchAuthStatus);

  const [youtubeAuthStatus, setYouTubeAuthStatus] =
    useState<SafeYouTubeAuthState>(defaultYouTubeAuthStatus);

  const [twitchStatus, setTwitchStatus] =
    useState<TwitchConnectionStatus>(defaultTwitchStatus);

  const [youtubeStatus, setYoutubeStatus] =
    useState<YouTubeConnectionStatus>(defaultYouTubeStatus);

  const [twitchViewersStatus, setTwitchViewersStatus] =
    useState<TwitchViewersStatus>(defaultTwitchViewersStatus);

  const [mockOverlayEnabled, setMockOverlayEnabled] = useState(false);
  const [chatActionStatus, setChatActionStatus] = useState("");

  const [overlayWidth, setOverlayWidth] = useState(800);
  const [overlayHeight, setOverlayHeight] = useState(600);
  const [overlayFontSize, setOverlayFontSize] = useState(24);
  const [overlayFontFamily, setOverlayFontFamily] = useState(
    "Inter, Arial, sans-serif"
  );
  const [availableFonts] = useState<string[]>(fallbackFonts);

  const [overlayChatWidth, setOverlayChatWidth] = useState(520);
  const [overlayMaxMessages, setOverlayMaxMessages] = useState(12);
  const [overlayPosition, setOverlayPosition] =
    useState<OverlayPosition>("left");

  const [overlayShowPlatformIcon, setOverlayShowPlatformIcon] = useState(true);
  const [overlayShowChannelName, setOverlayShowChannelName] = useState(true);
  const [overlayShowAuthorName, setOverlayShowAuthorName] = useState(true);

  const [overlayBackgroundOpacity, setOverlayBackgroundOpacity] = useState(65);
  const [overlayBackgroundColor, setOverlayBackgroundColor] =
    useState("#000000");
  const [overlayBorderRadius, setOverlayBorderRadius] = useState(12);
  const [overlayMessageGap, setOverlayMessageGap] = useState(8);

  const [overlayStyleMode, setOverlayStyleMode] =
    useState<OverlayStyleMode>("messageBubble");
  const [overlayShowStyleInApp, setOverlayShowStyleInApp] = useState(false);
  const [overlayBubbleMediaUrl, setOverlayBubbleMediaUrl] = useState("");
  const [overlayBubbleMediaType, setOverlayBubbleMediaType] =
    useState<OverlayBubbleMediaType>("none");
  const [overlayAssetUploadStatus, setOverlayAssetUploadStatus] = useState("");

  const [filterHideCommands, setFilterHideCommands] = useState(false);
  const [filterHideLinks, setFilterHideLinks] = useState(false);
  const [filterOnlyWords, setFilterOnlyWords] = useState("");
  const [filterHighlightWords, setFilterHighlightWords] = useState("");

  const [updateSettings, setUpdateSettings] =
    useState<UpdateSettings>(defaultUpdateSettings);
  const [updateStatus, setUpdateStatus] = useState<UpdateCheckResult | null>(
    null
  );
  const [checkingUpdates, setCheckingUpdates] = useState(false);
  const [installingUpdate, setInstallingUpdate] = useState(false);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [disableUpdateCheckOnDecline, setDisableUpdateCheckOnDecline] =
    useState(false);

  const [copyStatus, setCopyStatus] = useState("");
  const [chatOnlyMode, setChatOnlyMode] = useState(false);

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
      fontFamily: overlayFontFamily,
      chatWidth: clampNumber(overlayChatWidth, 520, 200, 3000),
      maxMessages: clampNumber(overlayMaxMessages, 12, 1, 100),
      position: overlayPosition,

      showPlatformIcon: overlayShowPlatformIcon,
      showChannelName: overlayShowChannelName,
      showAuthorName: overlayShowAuthorName,

      backgroundOpacity: clampNumber(overlayBackgroundOpacity, 65, 0, 100),
      backgroundColor: overlayBackgroundColor,
      borderRadius: clampNumber(overlayBorderRadius, 12, 0, 60),
      messageGap: clampNumber(overlayMessageGap, 8, 0, 40),

      styleMode: overlayStyleMode,
      showStyleInApp: overlayShowStyleInApp,
      bubbleMediaUrl: overlayBubbleMediaUrl,
      bubbleMediaType: overlayBubbleMediaType,

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
    overlayFontFamily,
    overlayChatWidth,
    overlayMaxMessages,
    overlayPosition,
    overlayShowPlatformIcon,
    overlayShowChannelName,
    overlayShowAuthorName,
    overlayBackgroundOpacity,
    overlayBackgroundColor,
    overlayBorderRadius,
    overlayMessageGap,
    overlayStyleMode,
    overlayShowStyleInApp,
    overlayBubbleMediaUrl,
    overlayBubbleMediaType,
    filterHideCommands,
    filterHideLinks,
    filterOnlyWords,
    filterHighlightWords,
  ]);

  const appSettings = useMemo<AppSettings>(() => {
    return {
      sources,
      youtubeApiKey: "",
      overlay: overlaySettings,
      updates: updateSettings,
    };
  }, [sources, overlaySettings, updateSettings]);

  async function reportClientError(payload: {
    type: string;
    message?: string;
    stack?: string;
    source?: string;
    lineno?: number;
    colno?: number;
    reason?: unknown;
  }) {
    try {
      await fetch("http://localhost:3877/diagnostics/client-error", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...payload,
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: Date.now(),
        }),
      });
    } catch {
      // ignore logging errors
    }
  }

  async function loadSettingsFromServer() {
    const response = await fetch("http://localhost:3877/settings");
    const data = (await response.json()) as AppSettings;

    setSources(data.sources || []);

    setOverlayWidth(data.overlay.width);
    setOverlayHeight(data.overlay.height);
    setOverlayFontSize(data.overlay.fontSize);
    setOverlayFontFamily(data.overlay.fontFamily || "Inter, Arial, sans-serif");
    setOverlayChatWidth(data.overlay.chatWidth);
    setOverlayMaxMessages(data.overlay.maxMessages);
    setOverlayPosition(data.overlay.position);

    setOverlayShowPlatformIcon(data.overlay.showPlatformIcon);
    setOverlayShowChannelName(data.overlay.showChannelName);
    setOverlayShowAuthorName(data.overlay.showAuthorName);

    setOverlayBackgroundOpacity(data.overlay.backgroundOpacity);
    setOverlayBackgroundColor(data.overlay.backgroundColor || "#000000");
    setOverlayBorderRadius(data.overlay.borderRadius);
    setOverlayMessageGap(data.overlay.messageGap);

    setOverlayStyleMode(data.overlay.styleMode || "messageBubble");
    setOverlayShowStyleInApp(Boolean(data.overlay.showStyleInApp));
    setOverlayBubbleMediaUrl(data.overlay.bubbleMediaUrl || "");
    setOverlayBubbleMediaType(data.overlay.bubbleMediaType || "none");

    setFilterHideCommands(data.overlay.filters.hideCommands);
    setFilterHideLinks(data.overlay.filters.hideLinks);
    setFilterOnlyWords(data.overlay.filters.onlyWords);
    setFilterHighlightWords(data.overlay.filters.highlightWords);

    setUpdateSettings(data.updates || defaultUpdateSettings);

    return data;
  }

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

  async function loadYouTubeAuthStatus() {
    try {
      const response = await fetch("http://localhost:3877/youtube/auth/status");
      const data = (await response.json()) as SafeYouTubeAuthState;
      setYouTubeAuthStatus(data);
      return data;
    } catch {
      return defaultYouTubeAuthStatus;
    }
  }

  async function loadTwitchViewersStatus() {
    try {
      const response = await fetch("http://localhost:3877/twitch/viewers");
      const data = (await response.json()) as TwitchViewersStatus;
      setTwitchViewersStatus(data);
      return data;
    } catch {
      setTwitchViewersStatus(defaultTwitchViewersStatus);
      return defaultTwitchViewersStatus;
    }
  }

  async function checkUpdates(force = false, shouldShowPrompt = false) {
    try {
      setCheckingUpdates(true);

      const response = await fetch(
        `http://localhost:3877/updates/check${force ? "?force=true" : ""}`
      );

      const data = (await response.json()) as UpdateCheckResult;
      setUpdateStatus(data);

      if (shouldShowPrompt && data.updateAvailable) {
        setShowUpdatePrompt(true);
      }

      return data;
    } catch {
      const failedResult: UpdateCheckResult = {
        ok: false,
        currentVersion: "unknown",
        latestVersion: null,
        updateAvailable: false,
        releaseUrl: null,
        downloadUrl: null,
        releaseNotes: "",
        checkedAt: Date.now(),
        error: t("updatesCheckFailed"),
      };

      setUpdateStatus(failedResult);
      return failedResult;
    } finally {
      setCheckingUpdates(false);
    }
  }

  async function setAutoCheckUpdates(enabled: boolean) {
    const nextSettings: UpdateSettings = {
      ...updateSettings,
      autoCheckEnabled: enabled,
    };

    setUpdateSettings(nextSettings);

    try {
      await fetch("http://localhost:3877/updates/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(nextSettings),
      });

      setChatActionStatus(
        enabled ? t("autoUpdatesEnabled") : t("autoUpdatesDisabled")
      );
    } catch {
      setChatActionStatus(t("settingsSaveFailed"));
    }
  }

  async function installUpdate() {
    if (!updateStatus?.downloadUrl) {
      setChatActionStatus(t("updateDownloadUnavailable"));
      return;
    }

    try {
      setInstallingUpdate(true);
      setChatActionStatus(t("installingUpdate"));

      const response = await fetch("http://localhost:3877/updates/install", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          downloadUrl: updateStatus.downloadUrl,
        }),
      });

      const data = (await response.json()) as UpdateInstallResult;

      if (!data.ok) {
        setInstallingUpdate(false);
        setChatActionStatus(data.error || t("updateInstallFailed"));
        return;
      }

      setChatActionStatus(t("updateInstallStarted"));
    } catch {
      setInstallingUpdate(false);
      setChatActionStatus(t("updateInstallFailed"));
    }
  }

  async function declineUpdate() {
    setShowUpdatePrompt(false);

    if (!disableUpdateCheckOnDecline) {
      return;
    }

    await setAutoCheckUpdates(false);
    setChatActionStatus(t("enableUpdatesAgainHint"));
  }

  function closeUpdatePrompt() {
    setShowUpdatePrompt(false);
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

        const settings = await loadSettingsFromServer();
        await connectChatWithSources(settings.sources || []);
        await loadTwitchViewersStatus();

        setChatActionStatus(`${t("twitchLoginDone")}: ${auth.username}`);
      }

      if (attempts > 120) {
        window.clearInterval(timer);
      }
    }, 1000);
  }

  function startYouTubeLogin() {
    setChatActionStatus("YouTube временно скрыт");
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
      await loadTwitchViewersStatus();
      setChatActionStatus(t("twitchLogoutDone"));
    } catch {
      setChatActionStatus(t("twitchLogoutFailed"));
    }
  }

  async function logoutYouTube() {
    setChatActionStatus("YouTube временно скрыт");
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
      setOverlayBackgroundColor("#000000");
      setOverlayBorderRadius(10);
      setOverlayMessageGap(6);
      setOverlayStyleMode("messageBubble");
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
      setOverlayBackgroundColor("#000000");
      setOverlayBorderRadius(12);
      setOverlayMessageGap(8);
      setOverlayStyleMode("messageBubble");
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
      setOverlayBackgroundColor("#000000");
      setOverlayBorderRadius(16);
      setOverlayMessageGap(10);
      setOverlayStyleMode("messageBubble");
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
    setOverlayBackgroundColor("#000000");
    setOverlayBorderRadius(0);
    setOverlayMessageGap(6);
    setOverlayStyleMode("color");
    setChatActionStatus(t("presetTextOnly"));
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
    setChatActionStatus(
      "После Twitch Login канал аккаунта добавляется автоматически"
    );
  }

  function addYouTubeSource() {
    const channelName = normalizeYouTubeInput(youtubeInput);

    if (!channelName) {
      setChatActionStatus(t("enterChannel"));
      return;
    }

    setChatActionStatus("YouTube временно скрыт");
  }

  function removeSource(sourceId: string) {
    const nextSources = sources.filter((source) => source.id !== sourceId);
    setSources(nextSources);
    void connectChatWithSources(nextSources);
  }

  function toggleSource(sourceId: string) {
    const nextSources = sources.map((source) =>
      source.id === sourceId
        ? {
            ...source,
            enabled: !source.enabled,
          }
        : source
    );

    setSources(nextSources);
    void connectChatWithSources(nextSources);
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
          youtubeApiKey: "",
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
      await loadTwitchViewersStatus();

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

      if (data.mockStatus?.running) {
        parts.push(t("testOverlayPart"));
      }

      setChatActionStatus(
        parts.length > 0
          ? `${t("activeSourcesStatus")}: ${parts.join(", ")}`
          : data.twitchStatus.error || t("noActiveSources")
      );
    } catch {
      setChatActionStatus(t("connectSourcesFailed"));
    }
  }

  async function clearMessages() {
    try {
      await fetch("http://localhost:3877/messages/clear", {
        method: "POST",
      });

      setMessages([]);
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    function handleWindowError(event: ErrorEvent) {
      void reportClientError({
        type: "window.error",
        message: event.message,
        stack: event.error instanceof Error ? event.error.stack : undefined,
        source: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    }

    function handleUnhandledRejection(event: PromiseRejectionEvent) {
      const reason = event.reason;

      void reportClientError({
        type: "window.unhandledrejection",
        message:
          reason instanceof Error
            ? reason.message
            : typeof reason === "string"
              ? reason
              : "Unhandled promise rejection",
        stack: reason instanceof Error ? reason.stack : undefined,
        reason:
          reason instanceof Error
            ? {
                name: reason.name,
                message: reason.message,
                stack: reason.stack,
              }
            : String(reason),
      });
    }

    window.addEventListener("error", handleWindowError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleWindowError);
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection
      );
    };
  }, []);

  useEffect(() => {
    async function loadInitialSettings() {
      try {
        const settings = await loadSettingsFromServer();

        setSettingsLoaded(true);
        setSaveStatus(t("settingsLoaded"));

        if (settings.updates?.autoCheckEnabled) {
          void checkUpdates(false, true);
        }
      } catch {
        setSettingsLoaded(true);
        setSaveStatus(t("settingsLoadFailed"));
      }
    }

    loadInitialSettings();
    loadTwitchAuthStatus();
    loadYouTubeAuthStatus();
    loadTwitchViewersStatus();
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
        // ignore
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
    const timer = window.setInterval(() => {
      void loadTwitchViewersStatus();
    }, 30_000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    async function loadStatuses() {
      try {
        const twitchResponse = await fetch("http://localhost:3877/twitch/status");
        const twitchData = (await twitchResponse.json()) as TwitchConnectionStatus;
        setTwitchStatus(twitchData);
      } catch {
        // ignore
      }

      try {
        const youtubeResponse = await fetch("http://localhost:3877/youtube/status");
        const youtubeData =
          (await youtubeResponse.json()) as YouTubeConnectionStatus;
        setYoutubeStatus(youtubeData);
      } catch {
        // ignore
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
        // ignore
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
          <div className="languageLogo brandLogo">SCH</div>

          <h1>Stream Chat Hub</h1>
          <h2>Выберите язык / Choose language</h2>

          <p>Выберите язык интерфейса сейчас.</p>
          <p>Choose your interface language now.</p>

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
    <main className={chatOnlyMode ? "app chatOnlyMode" : "app"}>
      <UpdatePromptModal
        t={t}
        updateStatus={showUpdatePrompt ? updateStatus : null}
        installingUpdate={installingUpdate}
        disableUpdateCheckOnDecline={disableUpdateCheckOnDecline}
        setDisableUpdateCheckOnDecline={setDisableUpdateCheckOnDecline}
        onInstallUpdate={installUpdate}
        onDeclineUpdate={declineUpdate}
        onCloseUpdatePrompt={closeUpdatePrompt}
      />

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
          youtubeAuthStatus={youtubeAuthStatus}
          activeAddSourceTab={activeAddSourceTab}
          setActiveAddSourceTab={setActiveAddSourceTab}
          anonymousTwitchChannelName={anonymousTwitchChannelName}
          setAnonymousTwitchChannelName={setAnonymousTwitchChannelName}
          authTwitchChannelName={authTwitchChannelName}
          setAuthTwitchChannelName={setAuthTwitchChannelName}
          youtubeInput={youtubeInput}
          setYoutubeInput={setYoutubeInput}
          chatActionStatus={chatActionStatus}
          toggleSource={toggleSource}
          removeSource={removeSource}
          addAnonymousTwitchSource={addAnonymousTwitchSource}
          addAuthTwitchSource={addAuthTwitchSource}
          addYouTubeSource={addYouTubeSource}
          startTwitchLogin={startTwitchLogin}
          logoutTwitch={logoutTwitch}
          startYouTubeLogin={startYouTubeLogin}
          logoutYouTube={logoutYouTube}
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
          overlayShowStyleInApp={overlayShowStyleInApp}
          overlayBackgroundOpacity={overlayBackgroundOpacity}
          overlayBackgroundColor={overlayBackgroundColor}
          overlayBorderRadius={overlayBorderRadius}
          overlayMessageGap={overlayMessageGap}
          overlayStyleMode={overlayStyleMode}
          overlayBubbleMediaUrl={overlayBubbleMediaUrl}
          overlayBubbleMediaType={overlayBubbleMediaType}
          overlayFontFamily={overlayFontFamily}
          availableFonts={availableFonts}
          overlayAssetUploadStatus={overlayAssetUploadStatus}
          setOverlayShowPlatformIcon={setOverlayShowPlatformIcon}
          setOverlayShowAuthorName={setOverlayShowAuthorName}
          setOverlayShowChannelName={setOverlayShowChannelName}
          setOverlayShowStyleInApp={setOverlayShowStyleInApp}
          setOverlayBackgroundOpacity={setOverlayBackgroundOpacity}
          setOverlayBackgroundColor={setOverlayBackgroundColor}
          setOverlayBorderRadius={setOverlayBorderRadius}
          setOverlayMessageGap={setOverlayMessageGap}
          setOverlayStyleMode={setOverlayStyleMode}
          setOverlayBubbleMediaUrl={setOverlayBubbleMediaUrl}
          setOverlayBubbleMediaType={setOverlayBubbleMediaType}
          setOverlayFontFamily={setOverlayFontFamily}
          setOverlayAssetUploadStatus={setOverlayAssetUploadStatus}
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
          copyOverlayUrl={copyOverlayUrl}
        />

        <TestOverlaySection
          t={t}
          mockOverlayEnabled={mockOverlayEnabled}
          setMockOverlayTestEnabled={setMockOverlayTestEnabled}
        />

        <UpdatesSection
          t={t}
          updateStatus={updateStatus}
          updateSettings={updateSettings}
          checkingUpdates={checkingUpdates}
          installingUpdate={installingUpdate}
          checkUpdates={checkUpdates}
          setAutoCheckUpdates={setAutoCheckUpdates}
        />

        <DiagnosticsSection t={t} />

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
        chatOnlyMode={chatOnlyMode}
        onToggleChatOnlyMode={() => setChatOnlyMode((current) => !current)}
        twitchViewersStatus={twitchViewersStatus}
        filterHighlightWords={filterHighlightWords}
        overlaySettings={overlaySettings}
      />
    </main>
  );
}