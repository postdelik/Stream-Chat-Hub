import { useEffect, useMemo, useRef, useState } from "react";
import type {
  AppChatAppearanceSettings,
  AppSettings,
  ChatMessage,
  ChatSource,
  OnboardingSettings,
  OverlayBubbleMediaType,
  OverlayPosition,
  OverlaySettings,
  OverlayStyleMode,
  OwnStreamStatus,
  SafeTwitchAuthState,
  SourceStreamStatus,
  TwitchConnectionStatus,
  TwitchEmoteSettings,
  TwitchViewersStatus,
  UpdateCheckResult,
  UpdateInstallResult,
  UpdateSettings,
} from "../shared/types";
import { languageStorageKey, overlayUrl } from "./constants";
import { translations, type AppLanguage } from "./i18n/translations";
import {
  createSourceId,
  normalizeSourceInput,
} from "./utils/chat";
import { clampNumber } from "./utils/numbers";
import { AboutSection } from "./components/AboutSection";
import { AppAppearanceSection } from "./components/AppAppearanceSection";
import { ChatView } from "./components/ChatView";
import { DiagnosticsSection } from "./components/DiagnosticsSection";
import { GuidedTour } from "./components/GuidedTour";
import { MessageFiltersSection } from "./components/MessageFiltersSection";
import { OnboardingModal } from "./components/OnboardingModal";
import {
  OverlayObsSection,
  type OverlayPreset,
} from "./components/OverlayObsSection";
import { SourcesSection, type AddSourceTab } from "./components/SourcesSection";
import { UpdatePromptModal } from "./components/UpdatePromptModal";
import { UpdatesSection } from "./components/UpdatesSection";
import { WYRMO_MOVED_URL } from "../shared/links";

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

const defaultTwitchAuthStatus: SafeTwitchAuthState = {
  enabled: false,
  username: null,
  scopes: [],
  expiresAt: null,
  hasToken: false,
};

const defaultTwitchViewersStatus: TwitchViewersStatus = {
  totalViewers: 0,
  channels: [],
  error: null,
};

function normalizeChannelName(value: string) {
  return value.trim().replace(/^#/, "").replace(/^@/, "").toLowerCase();
}

function buildSourceStreamStatuses({
  sources,
  twitchViewersStatus,
  checking,
}: {
  sources: ChatSource[];
  twitchViewersStatus: TwitchViewersStatus;
  checking: boolean;
}): SourceStreamStatus[] {
  return sources
    .filter((source) => source.enabled)
    .map((source) => {
      if (checking) {
        return {
          sourceId: source.id,
          platform: source.platform,
          channelName: source.channelName,
          state: "checking" as const,
          viewerCount: null,
          error: null,
        };
      }

      const normalizedName = normalizeChannelName(source.channelName);
      const channel = twitchViewersStatus.channels.find(
        (item) =>
          normalizeChannelName(item.channelName) === normalizedName
      );

      if (!channel) {
        return {
          sourceId: source.id,
          platform: source.platform,
          channelName: source.channelName,
          state: "error" as const,
          viewerCount: null,
          error:
            twitchViewersStatus.error ||
            "Не удалось получить статус Twitch",
        };
      }

      if (channel.error) {
        return {
          sourceId: source.id,
          platform: source.platform,
          channelName: source.channelName,
          state: "error" as const,
          viewerCount: null,
          error: channel.error,
        };
      }

      return {
        sourceId: source.id,
        platform: source.platform,
        channelName: source.channelName,
        state: channel.live ? ("live" as const) : ("offline" as const),
        viewerCount: channel.live ? channel.viewerCount : null,
        error: null,
      };
    });
}

const defaultUpdateSettings: UpdateSettings = {
  autoCheckEnabled: true,
  skippedVersion: "",
};

const defaultTwitchEmoteSettings: TwitchEmoteSettings = {
  sevenTvEnabled: true,
  betterTtvEnabled: true,
  frankerFaceZEnabled: true,
};

const CURRENT_ONBOARDING_VERSION = "0.5.0";
const ONBOARDING_UPGRADE_THRESHOLD = "0.5.0";

const defaultOnboardingSettings: OnboardingSettings = {
  initialChoiceMade: false,
  onboardingVersion: "",
  lastLaunchedVersion: "",
};

function compareSemanticVersions(left: string, right: string) {
  const parse = (value: string) =>
    value
      .replace(/^v/i, "")
      .split(".")
      .map((part) => Number.parseInt(part, 10) || 0);

  const leftParts = parse(left);
  const rightParts = parse(right);
  const length = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < length; index += 1) {
    const leftPart = leftParts[index] ?? 0;
    const rightPart = rightParts[index] ?? 0;

    if (leftPart > rightPart) {
      return 1;
    }

    if (leftPart < rightPart) {
      return -1;
    }
  }

  return 0;
}

const defaultAppChatAppearance: AppChatAppearanceSettings = {
  useOverlaySettings: true,
  fontSize: 24,
  fontFamily: "Inter, Arial, sans-serif",
  messageGap: 8,
  backgroundOpacity: 65,
  backgroundColor: "#000000",
  borderRadius: 12,
  showPlatformIcon: true,
  showChannelName: true,
  showAuthorName: true,
};

function detectOverlayPreset(
  overlay: OverlaySettings
): OverlayPreset {
  const compact =
    overlay.width === 420 &&
    overlay.height === 320 &&
    overlay.fontSize === 18 &&
    overlay.chatWidth === 360 &&
    overlay.maxMessages === 6 &&
    overlay.position === "left";

  if (compact) {
    return "compact";
  }

  const standard =
    overlay.width === 800 &&
    overlay.height === 600 &&
    overlay.fontSize === 24 &&
    overlay.chatWidth === 520 &&
    overlay.maxMessages === 12 &&
    overlay.position === "left";

  if (standard) {
    return "standard";
  }

  const textOnly =
    overlay.width === 700 &&
    overlay.height === 450 &&
    overlay.fontSize === 28 &&
    overlay.chatWidth === 620 &&
    overlay.maxMessages === 8 &&
    overlay.position === "left" &&
    overlay.backgroundOpacity === 0 &&
    overlay.showPlatformIcon === false &&
    overlay.showChannelName === false;

  return textOnly ? "textOnly" : "custom";
}

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

let initialChatConnectionStarted = false;

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

  const [twitchAuthStatus, setTwitchAuthStatus] =
    useState<SafeTwitchAuthState>(defaultTwitchAuthStatus);

  const [twitchStatus, setTwitchStatus] =
    useState<TwitchConnectionStatus>(defaultTwitchStatus);

  const [twitchViewersStatus, setTwitchViewersStatus] =
    useState<TwitchViewersStatus>(defaultTwitchViewersStatus);
  const [streamStatusChecking, setStreamStatusChecking] = useState(false);

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
  const [twitchEmotes, setTwitchEmotes] =
    useState<TwitchEmoteSettings>(defaultTwitchEmoteSettings);

  const [onboarding, setOnboarding] =
    useState<OnboardingSettings>(defaultOnboardingSettings);

  const [appChatAppearance, setAppChatAppearance] =
    useState<AppChatAppearanceSettings>(defaultAppChatAppearance);

  const [activeOverlayPreset, setActiveOverlayPreset] =
    useState<OverlayPreset>("standard");
  const [onboardingMode, setOnboardingMode] =
    useState<"choice" | "tutorial" | null>(null);

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

  const sourceStreamStatuses = useMemo(
    () =>
      buildSourceStreamStatuses({
        sources,
        twitchViewersStatus,
        checking: streamStatusChecking,
      }),
    [
      sources,
      twitchViewersStatus,
      streamStatusChecking,
    ]
  );

  const ownStreamStatuses = useMemo<OwnStreamStatus[]>(() => {
    const statuses: OwnStreamStatus[] = [];

    if (
      twitchAuthStatus.enabled &&
      twitchAuthStatus.hasToken &&
      twitchAuthStatus.username
    ) {
      const normalizedUsername = normalizeChannelName(
        twitchAuthStatus.username
      );
      const channel = twitchViewersStatus.channels.find(
        (item) =>
          normalizeChannelName(item.channelName) === normalizedUsername
      );

      if (streamStatusChecking) {
        statuses.push({
          platform: "twitch",
          channelName: twitchAuthStatus.username,
          state: "checking",
          viewerCount: null,
          error: null,
        });
      } else if (!channel) {
        statuses.push({
          platform: "twitch",
          channelName: twitchAuthStatus.username,
          state: "error",
          viewerCount: null,
          error:
            twitchViewersStatus.error ||
            "Не удалось получить статус Twitch",
        });
      } else if (channel.error) {
        statuses.push({
          platform: "twitch",
          channelName: twitchAuthStatus.username,
          state: "error",
          viewerCount: null,
          error: channel.error,
        });
      } else {
        statuses.push({
          platform: "twitch",
          channelName: twitchAuthStatus.username,
          state: channel.live ? "live" : "offline",
          viewerCount: channel.live ? channel.viewerCount : null,
          error: null,
        });
      }
    }

    return statuses;
  }, [
    sources,
    sourceStreamStatuses,
    streamStatusChecking,
    twitchAuthStatus,
    twitchViewersStatus,
  ]);

  const ownTwitchStreamStatus = ownStreamStatuses.find(
    (status) => status.platform === "twitch"
  );

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
      overlay: overlaySettings,
      updates: updateSettings,
      twitchEmotes,
      onboarding,
      appChatAppearance,
    };
  }, [
    sources,
    overlaySettings,
    updateSettings,
    twitchEmotes,
    onboarding,
    appChatAppearance,
  ]);

  function startOnboardingFromChoice() {
    setOnboarding((current) => ({
      ...current,
      initialChoiceMade: true,
      onboardingVersion: CURRENT_ONBOARDING_VERSION,
    }));
    setChatOnlyMode(false);
    setOnboardingMode("tutorial");
  }

  function declineOnboarding() {
    setOnboarding((current) => ({
      ...current,
      initialChoiceMade: true,
      onboardingVersion: CURRENT_ONBOARDING_VERSION,
    }));
    setOnboardingMode(null);
  }

  function startOnboardingAgain() {
    setChatOnlyMode(false);
    setOnboardingMode("tutorial");
  }

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

  async function loadCurrentAppVersion() {
    try {
      const response = await fetch("http://localhost:3877/app/version");
      const data = (await response.json()) as {
        currentVersion?: string;
      };

      return data.currentVersion || "0.0.0";
    } catch {
      return "0.0.0";
    }
  }

  async function loadSettingsFromServer() {
    const [settingsResponse, currentVersion] = await Promise.all([
      fetch("http://localhost:3877/settings"),
      loadCurrentAppVersion(),
    ]);

    const data = (await settingsResponse.json()) as AppSettings;

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
    setActiveOverlayPreset(detectOverlayPreset(data.overlay));

    setAppChatAppearance({
      useOverlaySettings:
        data.appChatAppearance?.useOverlaySettings ?? true,
      fontSize:
        data.appChatAppearance?.fontSize ?? data.overlay.fontSize ?? 24,
      fontFamily:
        data.appChatAppearance?.fontFamily ||
        data.overlay.fontFamily ||
        "Inter, Arial, sans-serif",
      messageGap:
        data.appChatAppearance?.messageGap ?? data.overlay.messageGap ?? 8,
      backgroundOpacity:
        data.appChatAppearance?.backgroundOpacity ??
        data.overlay.backgroundOpacity ??
        65,
      backgroundColor:
        data.appChatAppearance?.backgroundColor ||
        data.overlay.backgroundColor ||
        "#000000",
      borderRadius:
        data.appChatAppearance?.borderRadius ??
        data.overlay.borderRadius ??
        12,
      showPlatformIcon:
        data.appChatAppearance?.showPlatformIcon ??
        data.overlay.showPlatformIcon ??
        true,
      showChannelName:
        data.appChatAppearance?.showChannelName ??
        data.overlay.showChannelName ??
        true,
      showAuthorName:
        data.appChatAppearance?.showAuthorName ??
        data.overlay.showAuthorName ??
        true,
    });

    setFilterHideCommands(data.overlay.filters.hideCommands);
    setFilterHideLinks(data.overlay.filters.hideLinks);
    setFilterOnlyWords(data.overlay.filters.onlyWords);
    setFilterHighlightWords(data.overlay.filters.highlightWords);

    setUpdateSettings(data.updates || defaultUpdateSettings);
    setTwitchEmotes({
      sevenTvEnabled: data.twitchEmotes?.sevenTvEnabled ?? true,
      betterTtvEnabled: data.twitchEmotes?.betterTtvEnabled ?? true,
      frankerFaceZEnabled: data.twitchEmotes?.frankerFaceZEnabled ?? true,
    });

    const storedOnboarding = {
      initialChoiceMade:
        data.onboarding?.initialChoiceMade ?? false,
      onboardingVersion:
        data.onboarding?.onboardingVersion ?? "",
      lastLaunchedVersion:
        data.onboarding?.lastLaunchedVersion ?? "",
    };

    const upgradedFromOlderVersion =
      Boolean(storedOnboarding.lastLaunchedVersion) &&
      compareSemanticVersions(
        storedOnboarding.lastLaunchedVersion,
        ONBOARDING_UPGRADE_THRESHOLD
      ) < 0 &&
      compareSemanticVersions(
        currentVersion,
        ONBOARDING_UPGRADE_THRESHOLD
      ) >= 0 &&
      storedOnboarding.onboardingVersion !==
        CURRENT_ONBOARDING_VERSION;

    const shouldOfferOnboarding =
      !storedOnboarding.initialChoiceMade ||
      upgradedFromOlderVersion;

    const nextOnboarding: OnboardingSettings = {
      initialChoiceMade: shouldOfferOnboarding
        ? false
        : storedOnboarding.initialChoiceMade,
      onboardingVersion:
        storedOnboarding.onboardingVersion,
      lastLaunchedVersion: currentVersion,
    };

    setOnboarding(nextOnboarding);

    if (shouldOfferOnboarding) {
      setOnboardingMode("choice");
    }

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

  async function loadTwitchViewersStatus() {
    setStreamStatusChecking(true);

    try {
      const twitchResponse = await fetch("http://localhost:3877/twitch/viewers");
      const twitchData = (await twitchResponse.json()) as TwitchViewersStatus;

      setTwitchViewersStatus(twitchData);

      return twitchData;
    } catch {
      setTwitchViewersStatus({
        totalViewers: 0,
        channels: [],
        error: "Не удалось проверить статус стрима",
      });

      return defaultTwitchViewersStatus;
    } finally {
      setStreamStatusChecking(false);
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
          migration: updateStatus.migration === true,
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

    if (updateStatus?.migration && updateStatus.latestVersion) {
      const nextSettings = {
        ...updateSettings,
        skippedVersion: updateStatus.latestVersion,
      };
      setUpdateSettings(nextSettings);
      await fetch("http://localhost:3877/updates/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextSettings),
      });
      return;
    }

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
        await connectChatWithSources(
          settings.sources || [],
          settings.twitchEmotes || defaultTwitchEmoteSettings
        );
        await loadTwitchViewersStatus();

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
      await loadTwitchViewersStatus();
      setChatActionStatus(t("twitchLogoutDone"));
    } catch {
      setChatActionStatus(t("twitchLogoutFailed"));
    }
  }

  function applyOverlayPreset(
    preset: Exclude<OverlayPreset, "custom">
  ) {
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
      setActiveOverlayPreset("compact");
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
      setActiveOverlayPreset("standard");
      setChatActionStatus(t("presetStandard"));
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
    setActiveOverlayPreset("textOnly");
    setChatActionStatus(t("presetTextOnly"));
  }

  function markOverlayCustom() {
    setActiveOverlayPreset("custom");
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

  async function setTwitchEmoteProviderEnabled(
    provider: keyof TwitchEmoteSettings,
    enabled: boolean
  ) {
    const nextSettings: TwitchEmoteSettings = {
      ...twitchEmotes,
      [provider]: enabled,
    };

    setTwitchEmotes(nextSettings);
    await connectChatWithSources(sources, nextSettings);
  }

  async function connectChatWithSources(
    nextSources: ChatSource[],
    nextTwitchEmotes: TwitchEmoteSettings = twitchEmotes
  ) {
    try {
      setChatActionStatus(t("connectingSources"));

      const response = await fetch("http://localhost:3877/chat/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sources: nextSources,
          twitchEmotes: nextTwitchEmotes,
        }),
      });

      const data = (await response.json()) as {
        ok: boolean;
        twitchStatus: TwitchConnectionStatus;
        mockStatus?: {
          running: boolean;
        };
      };

      setTwitchStatus(data.twitchStatus);
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

        const enabledSources = (settings.sources || []).filter(
          (source) => source.enabled
        );

        if (
          enabledSources.length > 0 &&
          !initialChatConnectionStarted
        ) {
          initialChatConnectionStarted = true;
          void connectChatWithSources(
            settings.sources || [],
            settings.twitchEmotes || defaultTwitchEmoteSettings
          );
        }

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
      <OnboardingModal
        open={onboardingMode === "choice"}
        t={t}
        onStart={startOnboardingFromChoice}
        onDecline={declineOnboarding}
      />

      <GuidedTour
        open={onboardingMode === "tutorial"}
        t={t}
        onClose={() => setOnboardingMode(null)}
      />

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
        <div className="migrationBanner">
          <strong>{t("movedToWyrmoTitle")}</strong>
          <span>{t("movedToWyrmoText")}</span>
          <a href={WYRMO_MOVED_URL} target="_blank" rel="noreferrer">
            {t("goToWyrmo")}
          </a>
        </div>

        <SourcesSection
          t={t}
          enabledSourcesCount={enabledSourcesCount}
          twitchSourcesCount={twitchSourcesCount}
          sources={sources}
          twitchStatus={twitchStatus}
          twitchAuthStatus={twitchAuthStatus}
          activeAddSourceTab={activeAddSourceTab}
          setActiveAddSourceTab={setActiveAddSourceTab}
          anonymousTwitchChannelName={anonymousTwitchChannelName}
          setAnonymousTwitchChannelName={setAnonymousTwitchChannelName}
          authTwitchChannelName={authTwitchChannelName}
          setAuthTwitchChannelName={setAuthTwitchChannelName}
          chatActionStatus={chatActionStatus}
          toggleSource={toggleSource}
          removeSource={removeSource}
          addAnonymousTwitchSource={addAnonymousTwitchSource}
          addAuthTwitchSource={addAuthTwitchSource}
          startTwitchLogin={startTwitchLogin}
          logoutTwitch={logoutTwitch}
        />

        <OverlayObsSection
          t={t}
          activePreset={activeOverlayPreset}
          overlayWidth={overlayWidth}
          overlayHeight={overlayHeight}
          overlayFontSize={overlayFontSize}
          overlayFontFamily={overlayFontFamily}
          overlayChatWidth={overlayChatWidth}
          overlayMaxMessages={overlayMaxMessages}
          overlayPosition={overlayPosition}
          overlayShowPlatformIcon={overlayShowPlatformIcon}
          overlayShowAuthorName={overlayShowAuthorName}
          overlayShowChannelName={overlayShowChannelName}
          overlayBackgroundOpacity={overlayBackgroundOpacity}
          overlayBackgroundColor={overlayBackgroundColor}
          overlayBorderRadius={overlayBorderRadius}
          overlayMessageGap={overlayMessageGap}
          overlayStyleMode={overlayStyleMode}
          overlayBubbleMediaUrl={overlayBubbleMediaUrl}
          overlayBubbleMediaType={overlayBubbleMediaType}
          overlayAssetUploadStatus={overlayAssetUploadStatus}
          availableFonts={availableFonts}
          overlayUrl={overlayUrl}
          copyStatus={copyStatus}
          mockOverlayEnabled={mockOverlayEnabled}
          setOverlayWidth={setOverlayWidth}
          setOverlayHeight={setOverlayHeight}
          setOverlayFontSize={setOverlayFontSize}
          setOverlayFontFamily={setOverlayFontFamily}
          setOverlayChatWidth={setOverlayChatWidth}
          setOverlayMaxMessages={setOverlayMaxMessages}
          setOverlayPosition={setOverlayPosition}
          setOverlayShowPlatformIcon={setOverlayShowPlatformIcon}
          setOverlayShowAuthorName={setOverlayShowAuthorName}
          setOverlayShowChannelName={setOverlayShowChannelName}
          setOverlayBackgroundOpacity={setOverlayBackgroundOpacity}
          setOverlayBackgroundColor={setOverlayBackgroundColor}
          setOverlayBorderRadius={setOverlayBorderRadius}
          setOverlayMessageGap={setOverlayMessageGap}
          setOverlayStyleMode={setOverlayStyleMode}
          setOverlayBubbleMediaUrl={setOverlayBubbleMediaUrl}
          setOverlayBubbleMediaType={setOverlayBubbleMediaType}
          setOverlayAssetUploadStatus={setOverlayAssetUploadStatus}
          applyOverlayPreset={applyOverlayPreset}
          markOverlayCustom={markOverlayCustom}
          copyOverlayUrl={copyOverlayUrl}
          setMockOverlayTestEnabled={setMockOverlayTestEnabled}
        />

        <AppAppearanceSection
          t={t}
          settings={appChatAppearance}
          overlaySettings={overlaySettings}
          availableFonts={availableFonts}
          onChange={setAppChatAppearance}
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
          twitchEmotes={twitchEmotes}
          setTwitchEmoteProviderEnabled={setTwitchEmoteProviderEnabled}
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
          startOnboarding={startOnboardingAgain}
        />
      </aside>

      <ChatView
        messages={messages}
        messagesEndRef={messagesEndRef}
        t={t}
        clearMessages={clearMessages}
        chatOnlyMode={chatOnlyMode}
        onToggleChatOnlyMode={() => setChatOnlyMode((current) => !current)}
        ownStreamStatuses={ownStreamStatuses}
        showViewerCounter={
          ownTwitchStreamStatus?.state === "live" &&
          ownTwitchStreamStatus.viewerCount !== null
        }
        viewerCount={ownTwitchStreamStatus?.viewerCount ?? 0}
        filterHighlightWords={filterHighlightWords}
        overlaySettings={overlaySettings}
        appAppearance={appChatAppearance}
      />
    </main>
  );
}
