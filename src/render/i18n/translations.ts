export type AppLanguage = "ru" | "en";

export const translations: Record<AppLanguage, Record<string, string>> = {
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
