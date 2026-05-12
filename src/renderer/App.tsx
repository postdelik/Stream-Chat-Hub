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

type AppLanguage = "ru" | "en";

type CollapsibleSectionProps = {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  badge?: string;
};

type OverlayPreset = "compact" | "standard" | "large" | "textOnly";
type AddSourceTab = "anonymousTwitch" | "twitchLogin" | "youtube";

const languageStorageKey = "stream-chat-hub-language";

const translations: Record<AppLanguage, Record<string, string>> = {
  ru: {
    chooseLanguageTitle: "Выберите язык",
    chooseLanguageSubtitle:
      "Язык можно будет поменять позже в разделе «О проекте и контакты».",
    russian: "Русский",
    english: "English",

    appTitle: "Stream Chat Hub",

    sourcesTitle: "Источники чата",
    activeShort: "активн.",
    activeSources: "Активных источников",
    twitchConnection: "Twitch-соединение",
    connectedToChannels: "подключено к каналам",
    notConnected: "не подключено",
    twitchLogin: "Twitch Login",
    loggedInAs: "выполнен как",
    notLoggedIn: "не выполнен",
    youtubeConnection: "YouTube-соединение",
    connectedSources: "подключено источников",
    noSources: "Источники ещё не добавлены",
    sourceEnabled: "Источник включён",
    sourceDisabled: "Источник выключен",
    removeSource: "Удалить источник",

    anonymousTab: "Без входа",
    twitchLoginTab: "Twitch Login",
    youtubeLaterTab: "YouTube позже",

    publicTwitchRead: "Публичное чтение Twitch-чата",
    publicTwitchReadHint:
      "Вход не нужен. Подходит для простого чтения открытых Twitch-каналов.",
    twitchChannel: "Twitch-канал",
    twitchChannelPlaceholder: "Например: shroud",
    addTwitchChannel: "Добавить Twitch-канал",

    twitchAccountWork: "Работа через Twitch-аккаунт",
    twitchAccountWorkHint:
      "Пользователь входит через Twitch. Потом подключение к чату идёт с его user access token.",
    status: "Статус",
    loginDone: "Выполнен вход",
    loginNotDone: "Не выполнен вход",
    logoutTwitch: "Выйти из Twitch",
    loginWithTwitch: "Войти через Twitch",
    twitchChannelForReading: "Twitch-канал для чтения",
    addChannelViaLogin: "Добавить канал через Twitch Login",
    reconnectAfterLogin:
      "После входа нажми «Подключить источники», чтобы переподключить Twitch уже с авторизацией.",

    youtubeWillBeLater: "YouTube будет позже",
    youtubeWillBeLaterHint:
      "Вкладка уже есть, чтобы интерфейс был готов к двум платформам.",
    youtubeLinkOrVideoId: "YouTube-ссылка или video id",
    youtubeDisabledPlaceholder: "Пока пропускаем YouTube",
    youtubeApiKey: "YouTube API key",
    youtubeApiKeyPlaceholder: "Пока не используем",
    youtubeDisabled: "YouTube пока отключён",

    connectSources: "Подключить источники",
    disconnectSources: "Отключить Twitch/YouTube",

    obsOverlay: "OBS Overlay",
    quickPresetsHint:
      "Быстрые пресеты. После выбора можно вручную докрутить любые поля.",
    compact: "Компактный",
    standard: "Стандартный",
    large: "Большой",
    textOnly: "Только текст",
    obsWidth: "Ширина OBS",
    obsHeight: "Высота OBS",
    fontSize: "Размер шрифта",
    chatBlockWidth: "Ширина блока чата",
    messagesOnScreen: "Сообщений на экране",
    position: "Позиция",
    leftBottom: "Слева снизу",
    centerBottom: "По центру снизу",
    rightBottom: "Справа снизу",

    messageAppearance: "Внешний вид сообщений",
    showPlatformIcon: "Показывать иконку платформы",
    showAuthorName: "Показывать имя автора",
    showChannelName: "Показывать канал",
    backgroundOpacity: "Прозрачность фона",
    borderRadius: "Скругление",
    messageGap: "Расстояние",

    messageFilters: "Фильтры сообщений",
    hideCommands: "Скрывать команды, которые начинаются с !",
    hideLinks: "Скрывать сообщения со ссылками",
    onlyWords: "Показывать только сообщения со словами",
    onlyWordsPlaceholder: "Например: розыгрыш, вопрос, help",
    highlightWords: "Подсвечивать слова",
    highlightWordsPlaceholder: "Например: важно, донат, вопрос",
    filtersHint:
      "Слова разделяй запятыми. Фильтры применяются только к OBS overlay, общий чат в приложении остаётся полным.",

    obsLinkTitle: "Ссылка для OBS",
    copyLink: "Скопировать ссылку",
    settingsFile: "Файл настроек",
    obsLinkHint:
      "В OBS вставь короткую ссылку выше. Width и Height в OBS укажи такими же, как в полях приложения.",

    testOverlay: "Тест overlay",
    enabled: "включён",
    disabled: "выключен",
    enableTestOverlay: "Включить тест overlay",
    testOverlayHint:
      "Добавляет тестовые сообщения в общий поток. Можно проверять OBS, фильтры, размеры и внешний вид даже без реального чата.",
    testOverlayHint2:
      "Эта галочка не отключает Twitch. Тестовые сообщения просто идут рядом с настоящими.",

    aboutTitle: "О проекте и контакты",
    aboutText: "Приложение для объединения чатов стрима и вывода overlay в OBS.",
    projectGithub: "GitHub проекта",
    supportProject: "Поддержать проект",
    language: "Язык",
    changeLanguageHint:
      "Выбор языка сохраняется на этом компьютере и применится при следующем запуске.",

    commonChat: "Общий чат",
    messages: "сообщений",
    clear: "Очистить",

    copied: "Ссылка скопирована",
    copyFailed: "Не удалось скопировать",
    loadingSettings: "Загружаю настройки...",
    settingsLoaded: "Настройки загружены",
    settingsLoadFailed: "Не удалось загрузить настройки",
    savingSettings: "Сохраняю настройки...",
    settingsSaved: "Настройки сохранены",
    settingsSaveFailed: "Не удалось сохранить настройки",

    openTwitchLogin: "Открываю Twitch Login...",
    twitchLoginDone: "Twitch Login выполнен",
    twitchLogoutDone: "Twitch Login отключён",
    twitchLogoutFailed: "Не удалось выйти из Twitch",

    presetCompact: "Пресет overlay: Компактный",
    presetStandard: "Пресет overlay: Стандартный",
    presetLarge: "Пресет overlay: Большой",
    presetTextOnly: "Пресет overlay: Только текст",

    enterChannel: "Введите канал",
    sourceAlreadyAdded: "Такой источник уже добавлен",
    sourceAdded: "Источник добавлен",
    youtubeSkipped: "YouTube пока пропускаем, вкладка подготовлена на потом",

    testOverlayEnabled: "Тест overlay включён, тестовые сообщения летят в чат",
    testOverlayDisabled: "Тест overlay выключен",
    testOverlaySwitchFailed: "Не удалось переключить тест overlay",

    connectingSources: "Подключаю источники чата...",
    activeSourcesStatus: "Активные источники",
    noActiveSources: "Нет активных источников для подключения",
    connectSourcesFailed: "Ошибка подключения источников",
    disconnectingSources: "Отключаю Twitch и YouTube...",
    sourcesDisconnected: "Источники отключены",
    sourcesDisconnectedTestKeepsRunning:
      "Twitch и YouTube отключены, тест overlay продолжает работать",
    disconnectSourcesFailed: "Не удалось отключить источники",
    testOverlayPart: "Тест overlay",
  },

  en: {
    chooseLanguageTitle: "Choose language",
    chooseLanguageSubtitle:
      "You can change the language later in the “About and contacts” section.",
    russian: "Русский",
    english: "English",

    appTitle: "Stream Chat Hub",

    sourcesTitle: "Chat sources",
    activeShort: "active",
    activeSources: "Active sources",
    twitchConnection: "Twitch connection",
    connectedToChannels: "connected to channels",
    notConnected: "not connected",
    twitchLogin: "Twitch Login",
    loggedInAs: "logged in as",
    notLoggedIn: "not logged in",
    youtubeConnection: "YouTube connection",
    connectedSources: "connected sources",
    noSources: "No sources added yet",
    sourceEnabled: "Source enabled",
    sourceDisabled: "Source disabled",
    removeSource: "Remove source",

    anonymousTab: "No login",
    twitchLoginTab: "Twitch Login",
    youtubeLaterTab: "YouTube later",

    publicTwitchRead: "Public Twitch chat reading",
    publicTwitchReadHint:
      "No login required. Good for reading public Twitch channels.",
    twitchChannel: "Twitch channel",
    twitchChannelPlaceholder: "Example: shroud",
    addTwitchChannel: "Add Twitch channel",

    twitchAccountWork: "Work through a Twitch account",
    twitchAccountWorkHint:
      "The user logs in through Twitch. Chat connection then uses their user access token.",
    status: "Status",
    loginDone: "Logged in",
    loginNotDone: "Not logged in",
    logoutTwitch: "Log out of Twitch",
    loginWithTwitch: "Log in with Twitch",
    twitchChannelForReading: "Twitch channel to read",
    addChannelViaLogin: "Add channel through Twitch Login",
    reconnectAfterLogin:
      "After logging in, click “Connect sources” to reconnect Twitch with authorization.",

    youtubeWillBeLater: "YouTube will be added later",
    youtubeWillBeLaterHint:
      "The tab is already here so the interface is ready for two platforms.",
    youtubeLinkOrVideoId: "YouTube link or video id",
    youtubeDisabledPlaceholder: "YouTube is skipped for now",
    youtubeApiKey: "YouTube API key",
    youtubeApiKeyPlaceholder: "Not used yet",
    youtubeDisabled: "YouTube is disabled for now",

    connectSources: "Connect sources",
    disconnectSources: "Disconnect Twitch/YouTube",

    obsOverlay: "OBS Overlay",
    quickPresetsHint:
      "Quick presets. After choosing one, you can manually adjust any field.",
    compact: "Compact",
    standard: "Standard",
    large: "Large",
    textOnly: "Text only",
    obsWidth: "OBS width",
    obsHeight: "OBS height",
    fontSize: "Font size",
    chatBlockWidth: "Chat block width",
    messagesOnScreen: "Messages on screen",
    position: "Position",
    leftBottom: "Bottom left",
    centerBottom: "Bottom center",
    rightBottom: "Bottom right",

    messageAppearance: "Message appearance",
    showPlatformIcon: "Show platform icon",
    showAuthorName: "Show author name",
    showChannelName: "Show channel",
    backgroundOpacity: "Background opacity",
    borderRadius: "Border radius",
    messageGap: "Spacing",

    messageFilters: "Message filters",
    hideCommands: "Hide commands starting with !",
    hideLinks: "Hide messages with links",
    onlyWords: "Show only messages with words",
    onlyWordsPlaceholder: "Example: giveaway, question, help",
    highlightWords: "Highlight words",
    highlightWordsPlaceholder: "Example: important, donate, question",
    filtersHint:
      "Separate words with commas. Filters are applied only to the OBS overlay, the in-app chat remains complete.",

    obsLinkTitle: "OBS link",
    copyLink: "Copy link",
    settingsFile: "Settings file",
    obsLinkHint:
      "Paste the short link above into OBS. Set Width and Height in OBS to match the app fields.",

    testOverlay: "Test overlay",
    enabled: "enabled",
    disabled: "disabled",
    enableTestOverlay: "Enable test overlay",
    testOverlayHint:
      "Adds test messages to the shared stream. You can test OBS, filters, sizes, and appearance without real chat.",
    testOverlayHint2:
      "This checkbox does not disconnect Twitch. Test messages simply appear alongside real ones.",

    aboutTitle: "About and contacts",
    aboutText: "An app for combining stream chats and displaying an OBS overlay.",
    projectGithub: "Project GitHub",
    supportProject: "Support the project",
    language: "Language",
    changeLanguageHint:
      "The selected language is saved on this computer and will be used on the next launch.",

    commonChat: "Common chat",
    messages: "messages",
    clear: "Clear",

    copied: "Link copied",
    copyFailed: "Failed to copy",
    loadingSettings: "Loading settings...",
    settingsLoaded: "Settings loaded",
    settingsLoadFailed: "Failed to load settings",
    savingSettings: "Saving settings...",
    settingsSaved: "Settings saved",
    settingsSaveFailed: "Failed to save settings",

    openTwitchLogin: "Opening Twitch Login...",
    twitchLoginDone: "Twitch Login completed",
    twitchLogoutDone: "Twitch Login disconnected",
    twitchLogoutFailed: "Failed to log out of Twitch",

    presetCompact: "Overlay preset: Compact",
    presetStandard: "Overlay preset: Standard",
    presetLarge: "Overlay preset: Large",
    presetTextOnly: "Overlay preset: Text only",

    enterChannel: "Enter a channel",
    sourceAlreadyAdded: "This source is already added",
    sourceAdded: "Source added",
    youtubeSkipped: "YouTube is skipped for now, the tab is prepared for later",

    testOverlayEnabled: "Test overlay enabled, test messages are going to chat",
    testOverlayDisabled: "Test overlay disabled",
    testOverlaySwitchFailed: "Failed to switch test overlay",

    connectingSources: "Connecting chat sources...",
    activeSourcesStatus: "Active sources",
    noActiveSources: "No active sources to connect",
    connectSourcesFailed: "Failed to connect sources",
    disconnectingSources: "Disconnecting Twitch and YouTube...",
    sourcesDisconnected: "Sources disconnected",
    sourcesDisconnectedTestKeepsRunning:
      "Twitch and YouTube disconnected, test overlay keeps running",
    disconnectSourcesFailed: "Failed to disconnect sources",
    testOverlayPart: "Test overlay",
  },
};

function getSavedLanguage(): AppLanguage | null {
  const value = localStorage.getItem(languageStorageKey);

  if (value === "ru" || value === "en") {
    return value;
  }

  return null;
}

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

        <CollapsibleSection
          title={t("sourcesTitle")}
          badge={`${enabledSourcesCount} ${t("activeShort")}`}
        >
          <div className="connectionStatus">
            <p>
              {t("activeSources")}: {enabledSourcesCount}
            </p>
            <p>🟣 Twitch: {twitchSourcesCount}</p>
            <p>🔴 YouTube: {youtubeSourcesCount}</p>

            <p>
              {t("twitchConnection")}:{" "}
              {twitchStatus.connected
                ? `${t("connectedToChannels")} ${twitchStatus.channelNames.length}`
                : t("notConnected")}
            </p>

            <p>
              {t("twitchLogin")}:{" "}
              {twitchAuthStatus.enabled && twitchAuthStatus.username
                ? `${t("loggedInAs")} ${twitchAuthStatus.username}`
                : t("notLoggedIn")}
            </p>

            {twitchStatus.error && (
              <p className="errorText">{twitchStatus.error}</p>
            )}

            <p>
              {t("youtubeConnection")}:{" "}
              {youtubeStatus.connected
                ? `${t("connectedSources")}: ${connectedYoutubeSourcesCount}`
                : t("notConnected")}
            </p>

            {youtubeStatus.error && (
              <p className="errorText">{youtubeStatus.error}</p>
            )}
          </div>

          <div className="sourceList">
            {sources.length === 0 && (
              <p className="emptyText">{t("noSources")}</p>
            )}

            {sources.map((source) => (
              <div className="sourceRow" key={source.id}>
                <button
                  className={source.enabled ? "sourceToggle enabled" : "sourceToggle"}
                  type="button"
                  onClick={() => toggleSource(source.id)}
                  title={source.enabled ? t("sourceEnabled") : t("sourceDisabled")}
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
                  title={t("removeSource")}
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
              {t("anonymousTab")}
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
              {t("twitchLoginTab")}
            </button>

            <button
              className={
                activeAddSourceTab === "youtube" ? "tabButton active" : "tabButton"
              }
              type="button"
              onClick={() => setActiveAddSourceTab("youtube")}
            >
              {t("youtubeLaterTab")}
            </button>
          </div>

          {activeAddSourceTab === "anonymousTwitch" && (
            <div className="addSourceBox tabPanel">
              <MiniCollapsibleSection title={t("publicTwitchRead")}>
                <div className="tabIntro">
                  <strong>{t("publicTwitchRead")}</strong>
                  <small>{t("publicTwitchReadHint")}</small>
                </div>

                <label className="field">
                  <span>{t("twitchChannel")}</span>
                  <input
                    type="text"
                    placeholder={t("twitchChannelPlaceholder")}
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
                  {t("addTwitchChannel")}
                </button>
              </MiniCollapsibleSection>
            </div>
          )}

          {activeAddSourceTab === "twitchLogin" && (
            <div className="addSourceBox tabPanel">
              <MiniCollapsibleSection title={t("twitchAccountWork")}>
                <div className="tabIntro">
                  <strong>{t("twitchAccountWork")}</strong>
                  <small>{t("twitchAccountWorkHint")}</small>
                </div>

                <div className="authCard">
                  <div>
                    <span className="authLabel">{t("status")}</span>
                    <strong>
                      {twitchAuthStatus.enabled && twitchAuthStatus.username
                        ? `${t("loginDone")}: ${twitchAuthStatus.username}`
                        : t("loginNotDone")}
                    </strong>
                  </div>

                  {twitchAuthStatus.enabled && twitchAuthStatus.hasToken ? (
                    <button
                      className="button secondaryButton"
                      type="button"
                      onClick={logoutTwitch}
                    >
                      {t("logoutTwitch")}
                    </button>
                  ) : (
                    <button
                      className="button"
                      type="button"
                      onClick={startTwitchLogin}
                    >
                      {t("loginWithTwitch")}
                    </button>
                  )}
                </div>
              </MiniCollapsibleSection>

              <MiniCollapsibleSection title={t("twitchChannelForReading")}>
                <label className="field">
                  <span>{t("twitchChannelForReading")}</span>
                  <input
                    type="text"
                    placeholder={t("twitchChannelPlaceholder")}
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
                  {t("addChannelViaLogin")}
                </button>

                <p className="hint">{t("reconnectAfterLogin")}</p>
              </MiniCollapsibleSection>
            </div>
          )}

          {activeAddSourceTab === "youtube" && (
            <div className="addSourceBox tabPanel">
              <MiniCollapsibleSection title={t("youtubeWillBeLater")}>
                <div className="tabIntro">
                  <strong>{t("youtubeWillBeLater")}</strong>
                  <small>{t("youtubeWillBeLaterHint")}</small>
                </div>

                <label className="field">
                  <span>{t("youtubeLinkOrVideoId")}</span>
                  <input
                    type="text"
                    placeholder={t("youtubeDisabledPlaceholder")}
                    value={youtubeInput}
                    onChange={(event) => setYoutubeInput(event.target.value)}
                    disabled
                  />
                </label>

                <label className="field youtubeApiKeyField">
                  <span>{t("youtubeApiKey")}</span>
                  <input
                    type="password"
                    placeholder={t("youtubeApiKeyPlaceholder")}
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
                  {t("youtubeDisabled")}
                </button>
              </MiniCollapsibleSection>
            </div>
          )}

          <div className="buttonRow">
            <button className="button" type="button" onClick={connectChat}>
              {t("connectSources")}
            </button>

            <button
              className="button secondaryButton"
              type="button"
              onClick={disconnectChat}
            >
              {t("disconnectSources")}
            </button>
          </div>

          {chatActionStatus && <p className="copyStatus">{chatActionStatus}</p>}
        </CollapsibleSection>

        <CollapsibleSection
          title={t("obsOverlay")}
          badge={`${overlayWidth}×${overlayHeight}`}
        >
          <p className="hint">{t("quickPresetsHint")}</p>

          <div className="buttonRow">
            <button
              className="button ghostButton"
              type="button"
              onClick={() => applyOverlayPreset("compact")}
            >
              {t("compact")}
            </button>

            <button
              className="button ghostButton"
              type="button"
              onClick={() => applyOverlayPreset("standard")}
            >
              {t("standard")}
            </button>
          </div>

          <div className="buttonRow">
            <button
              className="button ghostButton"
              type="button"
              onClick={() => applyOverlayPreset("large")}
            >
              {t("large")}
            </button>

            <button
              className="button ghostButton"
              type="button"
              onClick={() => applyOverlayPreset("textOnly")}
            >
              {t("textOnly")}
            </button>
          </div>

          <div className="fieldGroup">
            <label className="field">
              <span>{t("obsWidth")}</span>
              <input
                type="number"
                min="100"
                value={overlayWidth}
                onChange={(event) => setOverlayWidth(Number(event.target.value))}
              />
            </label>

            <label className="field">
              <span>{t("obsHeight")}</span>
              <input
                type="number"
                min="100"
                value={overlayHeight}
                onChange={(event) => setOverlayHeight(Number(event.target.value))}
              />
            </label>

            <label className="field">
              <span>{t("fontSize")}</span>
              <input
                type="number"
                min="10"
                max="120"
                value={overlayFontSize}
                onChange={(event) => setOverlayFontSize(Number(event.target.value))}
              />
            </label>

            <label className="field">
              <span>{t("chatBlockWidth")}</span>
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
              <span>{t("messagesOnScreen")}</span>
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
              <span>{t("position")}</span>
              <select
                value={overlayPosition}
                onChange={(event) =>
                  setOverlayPosition(event.target.value as OverlayPosition)
                }
              >
                <option value="left">{t("leftBottom")}</option>
                <option value="center">{t("centerBottom")}</option>
                <option value="right">{t("rightBottom")}</option>
              </select>
            </label>
          </div>
        </CollapsibleSection>

        <CollapsibleSection title={t("messageAppearance")}>
          <div className="toggleGroup">
            <label className="toggleField">
              <input
                type="checkbox"
                checked={overlayShowPlatformIcon}
                onChange={(event) =>
                  setOverlayShowPlatformIcon(event.target.checked)
                }
              />
              <span>{t("showPlatformIcon")}</span>
            </label>

            <label className="toggleField">
              <input
                type="checkbox"
                checked={overlayShowAuthorName}
                onChange={(event) => setOverlayShowAuthorName(event.target.checked)}
              />
              <span>{t("showAuthorName")}</span>
            </label>

            <label className="toggleField">
              <input
                type="checkbox"
                checked={overlayShowChannelName}
                onChange={(event) =>
                  setOverlayShowChannelName(event.target.checked)
                }
              />
              <span>{t("showChannelName")}</span>
            </label>
          </div>

          <div className="fieldGroup">
            <label className="field">
              <span>
                {t("backgroundOpacity")}: {overlayBackgroundOpacity}%
              </span>
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
              <span>
                {t("borderRadius")}: {overlayBorderRadius}px
              </span>
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
              <span>
                {t("messageGap")}: {overlayMessageGap}px
              </span>
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

        <CollapsibleSection title={t("messageFilters")}>
          <div className="toggleGroup">
            <label className="toggleField">
              <input
                type="checkbox"
                checked={filterHideCommands}
                onChange={(event) => setFilterHideCommands(event.target.checked)}
              />
              <span>{t("hideCommands")}</span>
            </label>

            <label className="toggleField">
              <input
                type="checkbox"
                checked={filterHideLinks}
                onChange={(event) => setFilterHideLinks(event.target.checked)}
              />
              <span>{t("hideLinks")}</span>
            </label>
          </div>

          <label className="field filterField">
            <span>{t("onlyWords")}</span>
            <input
              type="text"
              placeholder={t("onlyWordsPlaceholder")}
              value={filterOnlyWords}
              onChange={(event) => setFilterOnlyWords(event.target.value)}
            />
          </label>

          <label className="field filterField">
            <span>{t("highlightWords")}</span>
            <input
              type="text"
              placeholder={t("highlightWordsPlaceholder")}
              value={filterHighlightWords}
              onChange={(event) => setFilterHighlightWords(event.target.value)}
            />
          </label>

          <p className="hint">{t("filtersHint")}</p>
        </CollapsibleSection>

        <CollapsibleSection title={t("obsLinkTitle")}>
          <code>{overlayUrl}</code>

          <button className="button" type="button" onClick={copyOverlayUrl}>
            {t("copyLink")}
          </button>

          {copyStatus && <p className="copyStatus">{copyStatus}</p>}

          <p className="copyStatus">{saveStatus}</p>

          {settingsFilePath && (
            <p className="hint">
              {t("settingsFile")}: <br />
              {settingsFilePath}
            </p>
          )}

          <p className="hint">{t("obsLinkHint")}</p>
        </CollapsibleSection>

        <CollapsibleSection
          title={t("testOverlay")}
          badge={mockOverlayEnabled ? t("enabled") : t("disabled")}
        >
          <label className="bigToggleField">
            <input
              type="checkbox"
              checked={mockOverlayEnabled}
              onChange={(event) => setMockOverlayTestEnabled(event.target.checked)}
            />
            <span>
              <strong>{t("enableTestOverlay")}</strong>
              <small>{t("testOverlayHint")}</small>
            </span>
          </label>

          <p className="hint">{t("testOverlayHint2")}</p>
        </CollapsibleSection>

        <CollapsibleSection title={t("aboutTitle")} badge="v0.1.4">
          <div className="aboutBox">
            <p>
              <strong>Stream Chat Hub</strong> beta v0.1.4
            </p>

            <p className="hint">{t("aboutText")}</p>

            <div className="linkList">
              <a
                href="https://github.com/postdelik/Stream-Chat-Hub"
                target="_blank"
                rel="noreferrer"
              >
                {t("projectGithub")}
              </a>

              <a
                href="https://boosty.to/postdelik"
                target="_blank"
                rel="noreferrer"
              >
                {t("supportProject")}
              </a>
            </div>

            <div className="languageSwitcher">
              <span>{t("language")}</span>

              <div className="languageSwitcherButtons">
                <button
                  className={language === "ru" ? "smallButton activeLanguage" : "smallButton"}
                  type="button"
                  onClick={() => chooseLanguage("ru")}
                >
                  RU
                </button>

                <button
                  className={language === "en" ? "smallButton activeLanguage" : "smallButton"}
                  type="button"
                  onClick={() => chooseLanguage("en")}
                >
                  EN
                </button>
              </div>
            </div>

            <p className="hint">{t("changeLanguageHint")}</p>
          </div>
        </CollapsibleSection>
      </aside>

      <section className="chat">
        <header className="chatHeader">
          <div>
            <h2>{t("commonChat")}</h2>
            <span>
              {messages.length} {t("messages")}
            </span>
          </div>

          <button className="smallButton" type="button" onClick={clearMessages}>
            {t("clear")}
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